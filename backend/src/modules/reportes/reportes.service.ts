import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FacturasService } from '../facturas/facturas.service';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ReportesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly facturasService: FacturasService,
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
  ) {
    if (!clienteId) {
      throw new BadRequestException('El clienteId es requerido.');
    }

    const cliente = await this.facturasService.findOneCliente(clienteId);
    if (!cliente) {
      throw new NotFoundException(`El cliente con ID ${clienteId} no existe.`);
    }

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
  ): Promise<Buffer> {
    const data = await this.obtenerEstadoCuenta(
      clienteId,
      fechaInicio,
      fechaFin,
    );
    const { cliente, facturas, pagos, resumen } = data;

    return new Promise((resolve, reject) => {
      try {
        const DocConstructor = (PDFDocument.default || PDFDocument) as new (
          options?: PDFKit.PDFDocumentOptions,
        ) => PDFKit.PDFDocument;
        const doc = new DocConstructor({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: Error) => reject(err));

        // Título Principal
        doc
          .font('Helvetica-Bold')
          .fontSize(22)
          .text('ESTADO DE CUENTA', { align: 'center' });
        doc.moveDown(0.2);
        doc
          .font('Helvetica')
          .fontSize(10)
          .text(
            `Rango de Fechas: ${fechaInicio || 'Inicio'} hasta ${fechaFin || 'Fin'}`,
            { align: 'center' },
          );
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        const yStart = doc.y;

        // Datos del Cliente
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .text('DATOS DEL CLIENTE', 50, yStart);
        doc.font('Helvetica').fontSize(10);
        doc.moveDown(0.5);
        doc.text(`Nombre: ${cliente.nombre}`);
        doc.text(`Identificación: ${cliente.ruc || 'N/A'}`);
        doc.text(`Correo: ${cliente.correo || 'N/A'}`);
        doc.text(`Teléfono: ${cliente.telefono || 'N/A'}`);

        // Resumen Financiero
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .text('RESUMEN DE SALDOS', 320, yStart);
        doc.font('Helvetica').fontSize(10);
        doc.moveDown(0.5);
        doc.text(`Total Facturado: $${resumen.totalFacturado.toFixed(2)}`, 320);
        doc.text(`Total Pagado: $${resumen.totalPagado.toFixed(2)}`, 320);
        doc
          .font('Helvetica-Bold')
          .text(
            `SALDO TOTAL PENDIENTE: $${resumen.saldoTotal.toFixed(2)}`,
            320,
          );

        doc.moveDown(2);
        doc.x = 50;

        // Tabla de Facturas
        doc.font('Helvetica-Bold').fontSize(12).text('FACTURAS EMITIDAS');
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        let tableY = doc.y;
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('No. Factura', 50, tableY);
        doc.text('Fecha', 160, tableY);
        doc.text('Estado', 240, tableY);
        doc.text('Total', 330, tableY, { align: 'right', width: 60 });
        doc.text('Abonado', 410, tableY, { align: 'right', width: 60 });
        doc.text('Pendiente', 490, tableY, { align: 'right', width: 60 });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        doc.font('Helvetica').fontSize(9);
        if (facturas.length > 0) {
          facturas.forEach((f) => {
            const lineY = doc.y;
            doc.text(f.numero || f.id, 50, lineY);
            doc.text(f.fechaEmision || 'N/A', 160, lineY);
            doc.text(f.estado || 'N/A', 240, lineY);
            doc.text(`$${f.total.toFixed(2)}`, 330, lineY, {
              align: 'right',
              width: 60,
            });
            doc.text(`$${f.pagado.toFixed(2)}`, 410, lineY, {
              align: 'right',
              width: 60,
            });
            doc.text(`$${f.pendiente.toFixed(2)}`, 490, lineY, {
              align: 'right',
              width: 60,
            });
            doc.moveDown(0.5);
          });
        } else {
          doc.text('No se registraron facturas en este periodo.', 50);
          doc.moveDown(0.5);
        }

        doc.moveDown(2);

        // Tabla de Pagos
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .text('ABONOS / PAGOS REALIZADOS');
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        tableY = doc.y;
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('No. Transacción', 50, tableY);
        doc.text('Fecha', 160, tableY);
        doc.text('Cuenta Destino', 240, tableY);
        doc.text('Monto', 450, tableY, { align: 'right', width: 100 });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        doc.font('Helvetica').fontSize(9);
        if (pagos.length > 0) {
          pagos.forEach((p) => {
            const lineY = doc.y;
            doc.text(p.numeroPago, 50, lineY);
            doc.text(p.fecha, 160, lineY);
            doc.text(p.cuentaBancaria, 240, lineY, { width: 200 });
            doc.text(`$${p.montoTotal.toFixed(2)}`, 450, lineY, {
              align: 'right',
              width: 100,
            });
            doc.moveDown(0.5);
          });
        } else {
          doc.text('No se registraron abonos en este periodo.', 50);
          doc.moveDown(0.5);
        }

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.end();
      } catch (error: unknown) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}
