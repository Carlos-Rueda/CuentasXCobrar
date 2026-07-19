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
        doc.on('end', () => {
          const finalBuffer = Buffer.concat(chunks);
          try {
            const fs = require('fs');
            const path = require('path');
            const pdfsDir = path.join(process.cwd(), 'pdfs');
            if (!fs.existsSync(pdfsDir)) {
              fs.mkdirSync(pdfsDir, { recursive: true });
            }
            const filePath = path.join(pdfsDir, `estado-cuenta-${clienteId}.pdf`);
            fs.writeFileSync(filePath, finalBuffer);
            console.log(`[EFS] Estado de Cuenta PDF guardado en: ${filePath}`);
          } catch (err) {
            console.error('[EFS] Error al guardar el Estado de Cuenta PDF:', err);
          }
          resolve(finalBuffer);
        });
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

  async generarReporteEmpresarialPdf(
    fechaInicio?: string,
    fechaFin?: string,
    token?: string,
    ip?: string,
  ): Promise<Buffer> {
    const [clientes, facturas, pagosDb] = await Promise.all([
      this.facturasService.findAllClientes(),
      this.facturasService.findAllFacturas(),
      this.prismaService.pagos_clientes.findMany({
        where: { estado: 'activo' },
        include: { detalles_pago: true },
      }),
    ]);

    const mapped = facturas
      .filter(
        (f) =>
          f.estado &&
          f.estado.toUpperCase() !== 'ANULADA' &&
          f.estado.toUpperCase() !== 'INACTIVA',
      )
      .map((f) => {
        const client = clientes.find((c) => c.id === f.clienteId);
        
        let pagado = 0;
        let ultimoPagoDate: Date | null = null;

        pagosDb.forEach((pago) => {
          const detail = pago.detalles_pago?.find((d) => d.factura_id === f.id);
          if (detail) {
            pagado += Number(detail.monto_pagado) || 0;
            if (pago.fecha_pago) {
              const pDate = new Date(pago.fecha_pago);
              if (!ultimoPagoDate || pDate > ultimoPagoDate) {
                ultimoPagoDate = pDate;
              }
            }
          }
        });

        return {
          factura: f.numero || f.id,
          cliente: client?.nombre || 'N/A',
          cedula: client?.cedula || 'N/A',
          fecha: f.fechaEmision ? f.fechaEmision.split('T')[0] : '—',
          monto: Number(f.total) || 0,
          pagado,
          ultimoPago: ultimoPagoDate ? ultimoPagoDate.toISOString().split('T')[0] : '—',
        };
      });

    const filtrados = mapped.filter((r) => {
      if (!r.fecha || r.fecha === '—') return true;
      if (fechaInicio && r.fecha < fechaInicio) return false;
      if (fechaFin && r.fecha > fechaFin) return false;
      return true;
    });

    return new Promise((resolve, reject) => {
      try {
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margin: 40,
          bufferPages: true,
        });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => {
          const finalBuffer = Buffer.concat(chunks);
          try {
            const fs = require('fs');
            const path = require('path');
            const pdfsDir = path.join(process.cwd(), 'pdfs');
            if (!fs.existsSync(pdfsDir)) {
              fs.mkdirSync(pdfsDir, { recursive: true });
            }
            const filename = `Reporte-Empresarial-${new Date().toISOString().slice(0, 10)}.pdf`;
            const filePath = path.join(pdfsDir, filename);
            fs.writeFileSync(filePath, finalBuffer);
            console.log(`[EFS] PDF de Reporte Empresarial guardado en: ${filePath}`);
          } catch (err) {
            console.error('[EFS] Error al guardar PDF de Reporte en EFS:', err);
          }
          resolve(finalBuffer);
        });
        doc.on('error', (err: Error) => reject(err));

        doc.rect(0, 0, 842, 15).fill('#C0392B');

        doc.fillColor('#C0392B');
        doc.font('Helvetica-Bold').fontSize(14).text('UNIVERSIDAD TÉCNICA DEL NORTE', 40, 25);
        doc.fillColor('#718096');
        doc.font('Helvetica').fontSize(9).text('Sistema de Cuentas por Cobrar — Reporte Empresarial', 40, 42);

        const fechaStr = new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
        doc.fillColor('#2D3748');
        doc.font('Helvetica').fontSize(8).text(`Generado el: ${fechaStr}`, 600, 25, { align: 'right', width: 200 });
        doc.text(`Total registros: ${filtrados.length}`, 600, 37, { align: 'right', width: 200 });

        doc.moveTo(40, 55).lineTo(802, 55).strokeColor('#E2E8F0').lineWidth(1).stroke();

        doc.y = 65;
        const columns = [
          { label: 'N° Factura', width: 100 },
          { label: 'Cliente', width: 220 },
          { label: 'Cédula / RUC', width: 100 },
          { label: 'Fecha Emisión', width: 90 },
          { label: 'Monto ($)', width: 80, align: 'right' },
          { label: 'Cobrado ($)', width: 80, align: 'right' },
          { label: 'Último Pago', width: 90 },
        ];

        doc.rect(40, doc.y, 762, 20).fill('#C0392B');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5);
        let curX = 45;
        columns.forEach(col => {
          doc.text(col.label, curX, doc.y - 15, { width: col.width, align: col.align || 'left' });
          curX += col.width + 10;
        });
        doc.y = doc.y + 10;

        let totalMonto = 0;
        let totalCobrado = 0;

        filtrados.forEach((r, idx) => {
          totalMonto += r.monto;
          totalCobrado += r.pagado;

          const rowY = doc.y;
          if (idx % 2 === 1) {
            doc.rect(40, rowY - 2, 762, 16).fill('#F7FAFC');
          }
          doc.fillColor('#2D3748').font('Helvetica').fontSize(8);
          let cellX = 45;
          const vals = [
            r.factura,
            r.cliente,
            r.cedula,
            r.fecha,
            `$${r.monto.toFixed(2)}`,
            `$${r.pagado.toFixed(2)}`,
            r.ultimoPago,
          ];
          vals.forEach((v, cIdx) => {
            const col = columns[cIdx];
            doc.text(v, cellX, rowY, { width: col.width, align: col.align || 'left' });
            cellX += col.width + 10;
          });
          doc.moveTo(40, rowY + 12).lineTo(802, rowY + 12).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
          doc.y = rowY + 15;

          if (doc.y > 500 && idx < filtrados.length - 1) {
            doc.addPage();
            doc.rect(0, 0, 842, 15).fill('#C0392B');
            doc.y = 35;
          }
        });

        const totY = doc.y + 10;
        doc.rect(40, totY, 762, 22).fill('#2D3748');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
        doc.text('TOTALES', 350, totY + 6);
        doc.text(`$${totalMonto.toFixed(2)}`, 555, totY + 6, { align: 'right', width: 80 });
        doc.text(`$${totalCobrado.toFixed(2)}`, 645, totY + 6, { align: 'right', width: 80 });

        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          doc.page.margins.bottom = 0;
          doc.moveTo(40, 545).lineTo(802, 545).strokeColor('#E2E8F0').lineWidth(1).stroke();
          doc.fillColor('#718096').font('Helvetica').fontSize(7.5);
          doc.text('© Universidad Técnica del Norte — Reporte Oficial de Tesorería', 40, 552);
          doc.text(`Página ${i + 1} de ${range.count}`, 690, 552, { align: 'right', width: 112 });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
