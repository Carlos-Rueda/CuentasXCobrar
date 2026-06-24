/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FacturacionApiService } from '../cuentas-cobrar/facturacion-api.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { PagoEntity } from './pago.entity';
import * as PDFDocument from 'pdfkit';

interface DbPagoWithDetalles {
  id: string;
  numero_pago: string;
  descripcion: string;
  cliente_id: string;
  cuenta_bancaria_id: string | null;
  fecha_pago: Date | null;
  detalles_pago?: Array<{
    factura_id: string;
    monto_pagado: any;
  }>;
}

@Injectable()
export class PagosService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(forwardRef(() => FacturacionApiService))
    private readonly facturacionApiService: FacturacionApiService,
  ) {}

  /**
   * Mapea un registro de Prisma (snake_case) al formato del frontend PagoEntity (camelCase).
   */
  private toEntity(db: DbPagoWithDetalles): PagoEntity {
    const detalles = db.detalles_pago
      ? db.detalles_pago.map((d) => ({
          facturaId: d.factura_id,
          montoAbonado: Number(d.monto_pagado),
        }))
      : [];

    const montoTotal = detalles.reduce(
      (sum: number, det) => sum + det.montoAbonado,
      0,
    );

    return {
      id: db.id,
      numeroPago: db.numero_pago,
      descripcion: db.descripcion,
      clienteId: db.cliente_id,
      cuentaBancariaId: db.cuenta_bancaria_id || '',
      montoTotal,
      fecha: db.fecha_pago
        ? db.fecha_pago.toISOString()
        : new Date().toISOString(),
      detalles,
    };
  }

  /**
   * Crea un nuevo pago de cliente en la base de datos real (Supabase) con validaciones.
   */
  async create(pagoDto: CreatePagoDto): Promise<PagoEntity> {
    const { clienteId, cuentaBancariaId, descripcion, detalles } = pagoDto;

    // 1. Validar que la cuenta bancaria exista usando Prisma (si se provee)
    if (cuentaBancariaId) {
      const cuentaExiste = await this.prismaService.cuentas_bancarias.findUnique({
        where: { id: cuentaBancariaId },
      });
      if (!cuentaExiste) {
        throw new NotFoundException(
          `La cuenta bancaria con ID ${cuentaBancariaId} no existe`,
        );
      }
    }

    // 2. Validar que el cliente exista en el servicio externo de facturación
    const clienteExiste =
      await this.facturacionApiService.obtenerClientePorId(clienteId);
    if (!clienteExiste) {
      throw new NotFoundException(
        `El cliente con ID ${clienteId} no existe en el sistema de facturación`,
      );
    }

    // 3. Generar número de pago secuencial PAG-CLI-XXXXX
    const count = await this.prismaService.pagos_clientes.count();
    const secuencial = String(count + 1).padStart(5, '0');
    const numeroPago = `PAG-CLI-${secuencial}`;

    // 4. Guardar transaccionalmente la cabecera del pago y sus detalles si existen
    const dbPago = await this.prismaService.$transaction(async (tx) => {
      const header = await tx.pagos_clientes.create({
        data: {
          cliente_id: clienteId,
          cuenta_bancaria_id: cuentaBancariaId || null,
          descripcion,
          numero_pago: numeroPago,
          estado: 'ACTIVO',
        },
      });

      if (detalles && detalles.length > 0) {
        await tx.detalles_pago.createMany({
          data: detalles.map((d) => ({
            pago_id: header.id,
            factura_id: d.facturaId,
            monto_pagado: d.montoAbonado,
          })),
        });
      }

      // Volver a consultar con detalles incluidos para retornar la entidad completa
      return await tx.pagos_clientes.findUnique({
        where: { id: header.id },
        include: { detalles_pago: true },
      });
    });

    return this.toEntity(dbPago!);
  }

  /**
   * Método de compatibilidad para registrar cobros desde otros servicios.
   */
  async registrarCobro(pagoDto: CreatePagoDto) {
    const pago = await this.create(pagoDto);

    // Obtener facturas afectadas para simular actualización
    const facturasAfectadas: any[] = [];
    if (pagoDto.detalles) {
      for (const det of pagoDto.detalles) {
        const pagado = await this.calcularPagadoParaFactura(det.facturaId);
        facturasAfectadas.push({
          id: det.facturaId,
          clienteId: pagoDto.clienteId,
          pendiente: pagado,
        });
      }
    }

    return {
      mensaje: 'Cobro registrado exitosamente y facturas actualizadas',
      pago,
      facturasAfectadas,
    };
  }

  /**
   * Obtiene todos los pagos registrados.
   */
  async findAll(): Promise<PagoEntity[]> {
    const list = await this.prismaService.pagos_clientes.findMany({
      include: { detalles_pago: true },
      orderBy: { created_at: 'desc' },
    });
    return list.map((item) => this.toEntity(item));
  }

  /**
   * Obtiene un pago específico por ID adjuntando datos del cliente.
   */
  async findOne(id: string): Promise<unknown> {
    const item = await this.prismaService.pagos_clientes.findUnique({
      where: { id },
      include: { detalles_pago: true },
    });
    if (!item) return null;

    const entity = this.toEntity(item);

    let cliente: any = null;
    try {
      cliente = await this.facturacionApiService.obtenerClientePorId(
        item.cliente_id,
      );
    } catch (error) {
      console.error(
        `Error al obtener información del cliente ${item.cliente_id}:`,
        error,
      );
    }

    return {
      ...entity,
      cliente,
    };
  }

  /**
   * Suma el monto total pagado para una factura específica.
   */
  async calcularPagadoParaFactura(facturaId: string): Promise<number> {
    const agg = await this.prismaService.detalles_pago.aggregate({
      where: { factura_id: facturaId },
      _sum: { monto_pagado: true },
    });
    return agg._sum.monto_pagado ? Number(agg._sum.monto_pagado) : 0;
  }

  /**
   * Obtiene facturas con su estado de saldo pendiente.
   */
  async obtenerFacturas() {
    const facturas = await this.facturacionApiService.obtenerFacturas();
    return await Promise.all(
      facturas.map(async (f) => {
        const pagado = await this.calcularPagadoParaFactura(f.id);
        return {
          id: f.id,
          clienteId: f.clienteId,
          total: f.total,
          pendiente: Math.max(0, Number(f.total) - pagado),
        };
      }),
    );
  }

  /**
   * Obtiene el estado de cuenta pendiente de un cliente.
   */
  async obtenerEstadoCuenta(clienteId: string) {
    const facturas = await this.obtenerFacturas();
    return facturas.filter((factura) => factura.clienteId === clienteId);
  }

  /**
   * Obtiene clientes que tienen saldos deudores pendientes.
   */
  async obtenerClientesConDeuda() {
    const resumen: Record<string, number> = {};
    const facturas = await this.obtenerFacturas();

    facturas.forEach((factura) => {
      if (factura.pendiente > 0) {
        if (!resumen[factura.clienteId]) {
          resumen[factura.clienteId] = 0;
        }
        resumen[factura.clienteId] += factura.pendiente;
      }
    });

    return Object.keys(resumen).map((clienteId) => ({
      clienteId,
      saldoPendiente: resumen[clienteId],
    }));
  }

  /**
   * Genera el reporte de pagos/cobros filtrado por rango de fechas.
   */
  async obtenerReporte(
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<PagoEntity[]> {
    const where: any = {};
    if (fechaInicio || fechaFin) {
      where.fecha_pago = {};
      if (fechaInicio) {
        where.fecha_pago.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        where.fecha_pago.lte = new Date(fechaFin);
      }
    }

    const list = await this.prismaService.pagos_clientes.findMany({
      where,
      include: { detalles_pago: true },
      orderBy: { created_at: 'asc' },
    });

    return list.map((item) => this.toEntity(item));
  }

  /**
   * Genera el comprobante de pago en PDF utilizando datos reales de Prisma y GraphQL.
   */
  async generarComprobantePdf(pagoId: string): Promise<Buffer> {
    const pago = await this.prismaService.pagos_clientes.findUnique({
      where: { id: pagoId },
      include: {
        cuentas_bancarias: true,
        detalles_pago: true,
      },
    });

    if (!pago) {
      throw new NotFoundException(`Pago con ID ${pagoId} no encontrado`);
    }

    const cliente = await this.facturacionApiService.obtenerClientePorId(
      pago.cliente_id,
    );

    // Obtener facturas de GraphQL para mapear IDs a números de factura reales
    let facturas: any[] = [];
    try {
      facturas = await this.facturacionApiService.obtenerFacturas();
    } catch (error) {
      console.error('Error al obtener facturas desde GraphQL para el PDF:', error);
    }

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

        // Cabecera del PDF
        doc
          .font('Helvetica-Bold')
          .fontSize(22)
          .text('COMPROBANTE DE PAGO', { align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        const yStart = doc.y;

        // Columna Izquierda: Datos del Pago
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .text('DATOS DEL PAGO', 50, yStart);
        doc.font('Helvetica').fontSize(10);
        doc.moveDown(0.5);
        doc.text(`Número de Pago: ${pago.numero_pago}`);
        doc.text(
          `Fecha: ${pago.fecha_pago ? pago.fecha_pago.toISOString().split('T')[0] : 'N/A'}`,
        );
        doc.text(`Descripción: ${pago.descripcion}`);
        const ctaNombre = pago.cuentas_bancarias?.nombre_cuenta || 'N/A';
        const ctaEntidad = pago.cuentas_bancarias?.entidad_bancaria || 'N/A';
        doc.text(`Cuenta Bancaria: ${ctaNombre} (${ctaEntidad})`);

        // Columna Derecha: Datos del Cliente
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .text('DATOS DEL CLIENTE', 320, yStart);
        doc.font('Helvetica').fontSize(10);
        doc.moveDown(0.5);
        doc.text(`Nombre: ${cliente?.nombre || 'N/A'}`, 320);
        doc.text(`RUC/Cédula: ${cliente?.cedula || 'N/A'}`, 320);
        doc.text(`Correo: ${cliente?.correo || 'N/A'}`, 320);

        doc.moveDown(2.5);

        // Reset x coordinate to 50 for Details table
        doc.x = 50;

        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .text('DETALLE DE FACTURAS ABONADAS');
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        // Cabecera de Tabla
        const tableY = doc.y;
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Número de Factura', 50, tableY);
        doc.text('Monto Abonado', 400, tableY, { align: 'right', width: 150 });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        doc.font('Helvetica').fontSize(10);
        let total = 0;
        if (pago.detalles_pago && pago.detalles_pago.length > 0) {
          pago.detalles_pago.forEach((det) => {
            const monto = Number(det.monto_pagado);
            total += monto;
            const lineY = doc.y;
            
            // Buscar la factura por ID para mostrar el número de factura real
            const facturaReal = facturas.find((f) => f.id === det.factura_id);
            const facturaLabel = facturaReal ? facturaReal.numeroFactura : det.factura_id;

            doc.text(facturaLabel, 50, lineY);
            doc.text(`$${monto.toFixed(2)}`, 400, lineY, {
              align: 'right',
              width: 150,
            });
            doc.moveDown(0.5);
          });
        } else {
          doc.text('Sin desglose de facturas.', 50);
          doc.moveDown(0.5);
        }

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        // Total
        const totalY = doc.y;
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('TOTAL ABONADO', 50, totalY);
        doc.text(`$${total.toFixed(2)}`, 400, totalY, {
          align: 'right',
          width: 150,
        });

        doc.end();
      } catch (error: unknown) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}
