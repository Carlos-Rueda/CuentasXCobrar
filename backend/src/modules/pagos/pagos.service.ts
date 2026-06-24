import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FacturacionApiService } from '../cuentas-cobrar/facturacion-api.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { PagoEntity } from './pago.entity';
import * as PDFDocument from 'pdfkit';

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
  private toEntity(db: any): PagoEntity {
    const detalles = db.detalles_pago
      ? db.detalles_pago.map((d: any) => ({
          facturaId: d.factura_id,
          montoAbonado: Number(d.monto_pagado),
        }))
      : [];

    const montoTotal = detalles.reduce((sum: number, det: any) => sum + det.montoAbonado, 0);

    return {
      id: db.id,
      numeroPago: db.numero_pago,
      descripcion: db.descripcion,
      clienteId: db.cliente_id,
      cuentaBancariaId: db.cuenta_bancaria_id || '',
      montoTotal,
      fecha: db.fecha_pago ? db.fecha_pago.toISOString() : new Date().toISOString(),
      detalles,
    };
  }

  /**
   * Crea un nuevo pago de cliente en la base de datos real (Supabase) con validaciones.
   */
  async create(pagoDto: CreatePagoDto): Promise<PagoEntity> {
    const { clienteId, cuentaBancariaId, descripcion, detalles } = pagoDto;

    // 1. Validar que la cuenta bancaria exista usando Prisma
    const cuentaExiste = await this.prismaService.cuentas_bancarias.findUnique({
      where: { id: cuentaBancariaId },
    });
    if (!cuentaExiste) {
      throw new NotFoundException(`La cuenta bancaria con ID ${cuentaBancariaId} no existe`);
    }

    // 2. Validar que el cliente exista en el servicio externo de facturación
    const clienteExiste = await this.facturacionApiService.obtenerClientePorId(clienteId);
    if (!clienteExiste) {
      throw new NotFoundException(`El cliente con ID ${clienteId} no existe en el sistema de facturación`);
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
          cuenta_bancaria_id: cuentaBancariaId,
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

    return this.toEntity(dbPago);
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
  async findOne(id: string): Promise<any | null> {
    const item = await this.prismaService.pagos_clientes.findUnique({
      where: { id },
      include: { detalles_pago: true },
    });
    if (!item) return null;

    const entity = this.toEntity(item);

    let cliente: any = null;
    try {
      cliente = await this.facturacionApiService.obtenerClientePorId(item.cliente_id);
    } catch (error) {
      console.error(`Error al obtener información del cliente ${item.cliente_id}:`, error);
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
  async obtenerReporte(fechaInicio?: string, fechaFin?: string): Promise<PagoEntity[]> {
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
   * Genera el recibo PDF asíncronamente desde la base de datos real.
   */
  async generarReciboPdf(id: string): Promise<Buffer> {
    const pago = await this.findOne(id);
    if (!pago) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }

    return new Promise((resolve, reject) => {
      try {
        const DocConstructor = (PDFDocument.default || PDFDocument) as any;
        const doc = new DocConstructor({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: any) => reject(err));

        // Cabecera del PDF
        doc.fontSize(20).text('COMPROBANTE DE COBRO', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`ID de Pago: ${pago.id}`);
        doc.text(`N° de Comprobante: ${pago.numeroPago}`);
        doc.text(`Fecha: ${pago.fecha}`);
        doc.text(`Concepto: ${pago.descripcion}`);
        doc.text(`Cliente: ${pago.cliente ? pago.cliente.nombre : pago.clienteId}`);
        doc.text(`Cuenta Bancaria Destino: ${pago.cuentaBancariaId}`);
        doc.text(`Monto Total: $${pago.montoTotal.toFixed(2)}`);
        doc.moveDown();

        doc.fontSize(14).text('Detalles del Pago', { underline: true });
        doc.moveDown(0.5);

        if (pago.detalles && pago.detalles.length > 0) {
          pago.detalles.forEach((det: any, idx: number) => {
            doc
              .fontSize(12)
              .text(
                `${idx + 1}. Factura: ${det.facturaId} - Monto Abonado: $${det.montoAbonado.toFixed(2)}`,
              );
          });
        } else {
          doc.fontSize(12).text('Sin facturas asociadas en el desglose.');
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
