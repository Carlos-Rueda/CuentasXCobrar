import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FacturasService } from '../facturas/facturas.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { PdfHelper } from '../pdf-helper';


@Injectable()
export class ReportesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly facturasService: FacturasService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async calcularPagadoParaFactura(facturaId: string): Promise<number> {
    const agg = await this.prismaService.detalles_pago.aggregate({
      where: {
        factura_id: facturaId,
        pagos_clientes: {
          estado: 'activo',
        },
      },
      _sum: { monto_pagado: true },
    });
    return agg._sum.monto_pagado ? Number(agg._sum.monto_pagado) : 0;
  }

  async obtenerEstadoCuenta(
    clienteId: string,
    fechaInicio?: string,
    fechaFin?: string,
    token?: string,
    ip?: string,
  ) {
    if (!clienteId) {
      throw new BadRequestException('El clienteId es requerido.');
    }

    const cliente = await this.facturasService.findOneCliente(clienteId);
    if (!cliente) {
      throw new NotFoundException(`El cliente con ID ${clienteId} no existe.`);
    }
    await this.auditoriaService.registrar({
      token,
      idFuncion: 6,
      accion: 'CONSULTAR',
      descripcion: 'Consulta de estado de cuenta del cliente',
      observacion: `Se consultó el estado de cuenta del cliente ${cliente.nombre} (${clienteId})`,
      ip,
    });

    // Obtener todas las facturas del cliente
    let facturasGql = await this.facturasService.findAllFacturas();
    facturasGql = facturasGql.filter((f) => f.clienteId === clienteId);

    // Mapear facturas con sus pagos acumulados
    const facturas = await Promise.all(
      facturasGql.map(async (f) => {
        const pagado = await this.calcularPagadoParaFactura(f.id);
        const pendiente = Math.max(0, Number(f.total) - pagado);
        return {
          id: f.id,
          numero: f.numero,
          fechaEmision: f.fechaEmision,
          total: Number(f.total),
          pagado,
          pendiente,
          estado: f.estado,
        };
      }),
    );

    // Consultar pagos en Prisma
    const queryPagos: any = {
      where: {
        cliente_id: clienteId,
        estado: 'activo',
      },
      include: {
        detalles_pago: true,
        cuentas_bancarias: true,
      },
      orderBy: {
        fecha_pago: 'asc',
      },
    };

    if (fechaInicio || fechaFin) {
      queryPagos.where.fecha_pago = {};
      if (fechaInicio) {
        queryPagos.where.fecha_pago.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        queryPagos.where.fecha_pago.lte = new Date(fechaFin);
      }
    }

    const pagosDb = (await this.prismaService.pagos_clientes.findMany(
      queryPagos,
    )) as any[];

    const pagos = pagosDb.map((p) => ({
      id: p.id,
      numeroPago: p.numero_pago,
      fecha: p.fecha_pago ? p.fecha_pago.toISOString().split('T')[0] : '',
      descripcion: p.descripcion,
      montoTotal: Number(
        p.detalles_pago.reduce((acc, d) => acc + Number(d.monto_pagado), 0),
      ),
      cuentaBancaria: p.cuentas_bancarias
        ? `${p.cuentas_bancarias.entidad_bancaria} - ${p.cuentas_bancarias.nombre_cuenta}`
        : 'N/A',
    }));

    // Filtrar facturas por fecha si se especifica rango
    const facturasFiltradas = facturas.filter((f) => {
      if (!f.fechaEmision) return true;
      const date = new Date(f.fechaEmision);
      if (fechaInicio && date < new Date(fechaInicio)) return false;
      if (fechaFin && date > new Date(fechaFin)) return false;
      return true;
    });

    const totalFacturado = facturasFiltradas.reduce(
      (sum, f) => sum + f.total,
      0,
    );
    const totalPagado = pagos.reduce((sum, p) => sum + p.montoTotal, 0);
    const saldoTotal = totalFacturado - totalPagado;

    return {
      cliente,
      facturas: facturasFiltradas,
      pagos,
      resumen: {
        totalFacturado,
        totalPagado,
        saldoTotal,
      },
    };
  }

  async generarEstadoCuentaPdf(
    clienteId: string,
    fechaInicio?: string,
    fechaFin?: string,
    token?: string,
    ip?: string,
  ): Promise<Buffer> {
    const data = await this.obtenerEstadoCuenta(
      clienteId,
      fechaInicio,
      fechaFin,
    );
    const { cliente, facturas, pagos, resumen } = data;

    await this.auditoriaService.registrar({
      token,
      idFuncion: 6,
      accion: 'DESCARGAR',
      descripcion: 'Descarga de estado de cuenta en PDF',
      observacion: `Se descargó el estado de cuenta del cliente ${cliente.nombre} (${clienteId})`,
      ip,
    });

    return new Promise((resolve, reject) => {
      try {
        const doc = PdfHelper.createDocument();
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: Error) => reject(err));

        // Cabecera estándar
        const rangoFechas = `Del ${fechaInicio || 'Inicio'} al ${fechaFin || 'Fin'}`;
        PdfHelper.drawHeader(doc, `Estado de Cuenta\n(${rangoFechas})`);

        // Metadatos
        const leftItems = [
          { label: 'Cliente', value: cliente.nombre || 'N/A' },
          { label: 'Identificación', value: cliente.ruc || 'N/A' },
          { label: 'Correo', value: cliente.correo || 'N/A' },
          { label: 'Teléfono', value: cliente.telefono || 'N/A' },
        ];
        const rightItems = [
          { label: 'Total Facturado', value: `$${resumen.totalFacturado.toFixed(2)}` },
          { label: 'Total Pagado', value: `$${resumen.totalPagado.toFixed(2)}` },
          { label: 'Saldo Pendiente', value: `$${resumen.saldoTotal.toFixed(2)}` },
        ];
        PdfHelper.drawMetadata(doc, leftItems, rightItems);

        // Tabla de Facturas
        doc.font('Helvetica-Bold').fontSize(11).fillColor(PdfHelper.TEXT_DARK).text('FACTURAS EMITIDAS');
        doc.moveDown(0.5);

        const facturasCols = [
          { label: 'No. Factura', width: 130 },
          { label: 'Fecha', width: 75 },
          { label: 'Estado', width: 95 },
          { label: 'Total', width: 55, align: 'right' },
          { label: 'Abonado', width: 55, align: 'right' },
          { label: 'Pendiente', width: 62, align: 'right' },
        ];
        PdfHelper.drawTableHeader(doc, facturasCols);

        if (facturas.length > 0) {
          facturas.forEach((f, idx) => {
            PdfHelper.drawTableRow(
              doc,
              [
                f.numero || f.id,
                f.fechaEmision || 'N/A',
                f.estado || 'N/A',
                `$${f.total.toFixed(2)}`,
                `$${f.pagado.toFixed(2)}`,
                `$${f.pendiente.toFixed(2)}`,
              ],
              facturasCols,
              idx % 2 === 1,
            );
          });
        } else {
          PdfHelper.drawTableRow(
            doc,
            ['No se registraron facturas en este periodo.', '', '', '', '', ''],
            facturasCols,
            false,
          );
        }

        doc.moveDown(1.5);

        // Tabla de Pagos
        doc.font('Helvetica-Bold').fontSize(11).fillColor(PdfHelper.TEXT_DARK).text('ABONOS / PAGOS REALIZADOS');
        doc.moveDown(0.5);

        const pagosCols = [
          { label: 'No. Transacción', width: 130 },
          { label: 'Fecha', width: 100 },
          { label: 'Cuenta Destino', width: 180 },
          { label: 'Monto', width: 62, align: 'right' },
        ];
        PdfHelper.drawTableHeader(doc, pagosCols);

        if (pagos.length > 0) {
          pagos.forEach((p, idx) => {
            PdfHelper.drawTableRow(
              doc,
              [
                p.numeroPago || 'N/A',
                p.fecha || 'N/A',
                p.cuentaBancaria || 'N/A',
                `$${p.montoTotal.toFixed(2)}`,
              ],
              pagosCols,
              idx % 2 === 1,
            );
          });
        } else {
          PdfHelper.drawTableRow(
            doc,
            ['No se registraron abonos en este periodo.', '', '', ''],
            pagosCols,
            false,
          );
        }

        PdfHelper.finalize(doc);
      } catch (error: unknown) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}
