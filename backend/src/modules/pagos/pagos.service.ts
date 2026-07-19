/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FacturacionApiService } from '../cuentas-cobrar/facturacion-api.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { PagoEntity } from './pago.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { PdfHelper } from '../pdf-helper';


interface DbPagoWithDetalles {
  id: string;
  numero_pago: string;
  descripcion: string;
  cliente_id: string;
  cuenta_bancaria_id: string | null;
  fecha_pago: Date | null;
  estado?: string | null;
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
    private readonly auditoriaService: AuditoriaService,
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
      estado: db.estado || 'activo',
    };
  }

  /**
   * Crea un nuevo pago de cliente en la base de datos real (Supabase) con validaciones.
   */
  async create(
    pagoDto: CreatePagoDto,
    token: string,
    ip: string,
  ): Promise<PagoEntity> {
    const { clienteId, cuentaBancariaId, descripcion, detalles } = pagoDto;

    if (!cuentaBancariaId) {
      throw new BadRequestException(
        'El ID de la cuenta bancaria es obligatorio.',
      );
    }

    // 1. Validar Cuenta (HU2 CA4): Verificar en Prisma que la cuenta bancaria exista y esté 'ACTIVO'
    const cuentaExiste = await this.prismaService.cuentas_bancarias.findUnique({
      where: { id: cuentaBancariaId },
    });
    if (!cuentaExiste || cuentaExiste.estado?.toUpperCase() !== 'ACTIVO') {
      throw new NotFoundException(
        `La cuenta bancaria con ID ${cuentaBancariaId} no existe o no se encuentra activa`,
      );
    }

    // 2. Validar Cliente (HU2 CA3): Validar que el cliente exista en el servicio externo de facturación
    const clienteExiste =
      await this.facturacionApiService.obtenerClientePorId(clienteId);
    if (!clienteExiste) {
      throw new NotFoundException(
        `El cliente con ID ${clienteId} no existe en el sistema de facturación`,
      );
    }

    // 3. Validar Facturas y Saldos (HU3 CA2): Recorrer detalles y validar montos contra saldos en GraphQL
    if (!detalles || detalles.length === 0) {
      throw new BadRequestException(
        'Debe proporcionar al menos un detalle de factura para registrar el pago',
      );
    }

    for (const det of detalles) {
      if (det.montoPagado <= 0) {
        throw new BadRequestException(
          `El monto pagado para la factura ${det.facturaId} debe ser mayor a 0`,
        );
      }

      const facturaReal = await this.facturacionApiService.obtenerFacturaPorId(
        det.facturaId,
      );
      if (!facturaReal) {
        throw new NotFoundException(
          `La factura con ID ${det.facturaId} no existe en el sistema de facturación`,
        );
      }

      const pagadoAnteriormente = await this.calcularPagadoParaFactura(
        det.facturaId,
      );
      const saldoRestante = Number(facturaReal.total) - pagadoAnteriormente;

      if (det.montoPagado > saldoRestante) {
        throw new BadRequestException(
          `El monto a pagar ($${det.montoPagado}) sobrepasa el saldo pendiente ($${saldoRestante.toFixed(2)}) de la factura ${facturaReal.numeroFactura || det.facturaId}`,
        );
      }
    }
    // 4. Generar Secuencial (HU2 CA4)
    const count = await this.prismaService.pagos_clientes.count();
    const secuencial = String(count + 1).padStart(5, '0');
    const numeroPago = `PAG-CLI-${secuencial}`;

    // 5. Transacción de Base de Datos: Guardar cabecera y detalles anidados en un solo movimiento
    const dbPago = await this.prismaService.$transaction(async (tx) => {
      return await tx.pagos_clientes.create({
        data: {
          cliente_id: clienteId,
          cuenta_bancaria_id: cuentaBancariaId,
          descripcion,
          numero_pago: numeroPago,
          estado: 'inactivo',
          detalles_pago: {
            create: (detalles || []).map((d) => ({
              factura_id: d.facturaId,
              monto_pagado: d.montoPagado,
            })),
          },
        },
        include: {
          detalles_pago: true,
          cuentas_bancarias: true,
        },
      });
    });

    await this.auditoriaService.registrar({
      token,
      idFuncion: 7,
      accion: 'CREAR',
      descripcion: 'Registro de pago',
      observacion: `Pago ${dbPago.numero_pago} registrado correctamente para el cliente ${clienteExiste.nombre}`,
      ip,
    });

    return this.toEntity(dbPago);
  }

  /**
   * Método de compatibilidad para registrar cobros desde otros servicios.
   */
  async registrarCobro(pagoDto: CreatePagoDto, token: string, ip: string) {
    const pago = await this.create(pagoDto, token, ip);

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
      include: { detalles_pago: true, cuentas_bancarias: true },
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
      include: { detalles_pago: true, cuentas_bancarias: true },
    });
    if (!item) {
      throw new NotFoundException(`El pago con ID ${id} no existe`);
    }

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
          estado: f.estado,
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
  async generarComprobantePdf(
    pagoId: string,
    token: string,
    ip: string,
  ): Promise<Buffer> {
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

    // Candado de impresión: una vez generado/descargado se marca con estado: 'activo'
    await this.prismaService.pagos_clientes.update({
      where: { id: pagoId },
      data: { estado: 'activo' },
    });

    const cliente = await this.facturacionApiService.obtenerClientePorId(
      pago.cliente_id,
    );

    // Obtener facturas de GraphQL para mapear IDs a números de factura reales y saldo
    let facturas: any[] = [];
    try {
      facturas = await this.facturacionApiService.obtenerFacturas();
    } catch (error) {
      console.error(
        'Error al obtener facturas desde GraphQL para el PDF:',
        error,
      );
    }

    // Pre-calcular saldos restantes
    const detallesConSaldos: any[] = [];
    if (pago.detalles_pago && pago.detalles_pago.length > 0) {
      for (const det of pago.detalles_pago) {
        const facturaReal = facturas.find((f) => f.id === det.factura_id);
        let saldoPendiente = 0;
        if (facturaReal) {
          const pagadoHistorico = await this.calcularPagadoParaFactura(
            det.factura_id,
          );
          saldoPendiente = Math.max(
            0,
            Number(facturaReal.total) - pagadoHistorico,
          );
        }
        detallesConSaldos.push({
          ...det,
          numeroFactura: facturaReal
            ? facturaReal.numeroFactura
            : det.factura_id,
          saldoPendiente,
        });
      }
    }
    await this.auditoriaService.registrar({
      token,
      idFuncion: 7,
      accion: 'DESCARGAR',
      descripcion: 'Descarga de comprobante de pago',
      observacion: `Se descargó el comprobante del pago ${pago.numero_pago}`,
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
            const filePath = path.join(pdfsDir, `comprobante-${pagoId}.pdf`);
            fs.writeFileSync(filePath, finalBuffer);
            console.log(`[EFS] Comprobante PDF guardado en: ${filePath}`);
          } catch (err) {
            console.error('[EFS] Error al guardar el comprobante PDF:', err);
          }
          resolve(finalBuffer);
        });
        doc.on('error', (err: Error) => reject(err));

        // Cabecera estándar
        PdfHelper.drawHeader(doc, 'Comprobante de Pago');

        // Metadatos
        const leftItems = [
          { label: 'Número de Pago', value: pago.numero_pago },
          { label: 'Fecha Pago', value: pago.fecha_pago ? pago.fecha_pago.toISOString().split('T')[0] : 'N/A' },
          { label: 'Cuenta Bancaria', value: `${pago.cuentas_bancarias?.nombre_cuenta || 'N/A'} (${pago.cuentas_bancarias?.entidad_bancaria || 'N/A'})` },
          { label: 'Descripción', value: pago.descripcion || 'Sin descripción' },
        ];
        const rightItems = [
          { label: 'Cliente', value: cliente?.nombre || 'N/A' },
          { label: 'RUC/Cédula', value: cliente?.cedula || (cliente as any)?.ruc || 'N/A' },
          { label: 'Correo', value: cliente?.correo || 'N/A' },
          { label: 'Teléfono', value: cliente?.telefono || 'N/A' },
        ];
        PdfHelper.drawMetadata(doc, leftItems, rightItems);

        // Tabla de facturas abonadas
        doc.font('Helvetica-Bold').fontSize(11).fillColor(PdfHelper.TEXT_DARK).text('DETALLE DE FACTURAS ABONADAS');
        doc.moveDown(0.5);

        const columns = [
          { label: 'Número de Factura', width: 220 },
          { label: 'Monto Abonado', width: 130, align: 'right' },
          { label: 'Saldo Pendiente', width: 130, align: 'right' },
        ];
        PdfHelper.drawTableHeader(doc, columns);

        let total = 0;
        if (detallesConSaldos.length > 0) {
          detallesConSaldos.forEach((det, idx) => {
            const monto = Number(det.monto_pagado);
            total += monto;
            PdfHelper.drawTableRow(
              doc,
              [
                det.numeroFactura || 'N/A',
                `$${monto.toFixed(2)}`,
                `$${det.saldoPendiente.toFixed(2)}`,
              ],
              columns,
              idx % 2 === 1,
            );
          });
        } else {
          PdfHelper.drawTableRow(
            doc,
            ['Sin desglose de facturas.', '', ''],
            columns,
            false,
          );
        }

        doc.moveDown(1);

        // Totalizador
        const totalY = doc.y;
        doc.rect(320, totalY, 242, 22).fill(PdfHelper.BG_LIGHT);
        doc.fillColor(PdfHelper.TEXT_DARK).font('Helvetica-Bold').fontSize(10);
        doc.text('TOTAL ABONADO:', 330, totalY + 6);
        doc.fillColor(PdfHelper.UTN_RED).font('Helvetica-Bold').fontSize(10);
        doc.text(`$${total.toFixed(2)}`, 450, totalY + 6, { align: 'right', width: 100 });

        PdfHelper.finalize(doc);
      } catch (error: unknown) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  async update(
    id: string,
    updatePagoDto: any,
    token: string,
    ip: string,
  ): Promise<PagoEntity> {
    const pago = await this.prismaService.pagos_clientes.findUnique({
      where: { id },
      include: { detalles_pago: true },
    });

    if (!pago) {
      throw new NotFoundException(`El pago con ID ${id} no existe.`);
    }

    if (pago.estado?.toLowerCase() !== 'inactivo') {
      throw new BadRequestException(
        `No se puede editar el pago. Solo se puede editar si el pago está inactivo (borrador/no impreso). Estado actual: '${pago.estado}'.`,
      );
    }

    const { clienteId, cuentaBancariaId, descripcion, detalles } =
      updatePagoDto;

    // Validar Cuenta
    if (cuentaBancariaId) {
      const cuentaExiste =
        await this.prismaService.cuentas_bancarias.findUnique({
          where: { id: cuentaBancariaId },
        });
      if (!cuentaExiste || cuentaExiste.estado?.toUpperCase() !== 'ACTIVO') {
        throw new NotFoundException(
          `La cuenta bancaria con ID ${cuentaBancariaId} no existe o no se encuentra activa`,
        );
      }
    }

    // Validar Cliente
    if (clienteId) {
      const clienteExiste =
        await this.facturacionApiService.obtenerClientePorId(clienteId);
      if (!clienteExiste) {
        throw new NotFoundException(
          `El cliente con ID ${clienteId} no existe en el sistema de facturación`,
        );
      }
    }

    const updated = await this.prismaService.$transaction(async (tx) => {
      // 1. Eliminar detalles anteriores
      await tx.detalles_pago.deleteMany({
        where: { pago_id: id },
      });

      // 2. Validar nuevos detalles
      if (detalles && detalles.length > 0) {
        for (const det of detalles) {
          if (det.montoPagado <= 0) {
            throw new BadRequestException(
              `El monto pagado para la factura ${det.facturaId} debe ser mayor a 0`,
            );
          }

          const facturaReal =
            await this.facturacionApiService.obtenerFacturaPorId(det.facturaId);
          if (!facturaReal) {
            throw new NotFoundException(
              `La factura con ID ${det.facturaId} no existe en el sistema de facturación`,
            );
          }

          const agg = await tx.detalles_pago.aggregate({
            where: {
              factura_id: det.facturaId,
              pagos_clientes: {
                estado: 'activo',
              },
            },
            _sum: { monto_pagado: true },
          });
          const pagadoAnteriormente = agg._sum.monto_pagado
            ? Number(agg._sum.monto_pagado)
            : 0;
          const saldoRestante = Number(facturaReal.total) - pagadoAnteriormente;

          if (det.montoPagado > saldoRestante) {
            throw new BadRequestException(
              `El monto a pagar ($${det.montoPagado}) sobrepasa el saldo pendiente ($${saldoRestante.toFixed(2)}) de la factura ${facturaReal.numeroFactura || det.facturaId}`,
            );
          }
        }

        // 3. Crear los nuevos detalles
        await tx.detalles_pago.createMany({
          data: detalles.map((d) => ({
            pago_id: id,
            factura_id: d.facturaId,
            monto_pagado: d.montoPagado,
          })),
        });
      }

      // 4. Actualizar cabecera
      return await tx.pagos_clientes.update({
        where: { id },
        data: {
          cliente_id: clienteId || undefined,
          cuenta_bancaria_id: cuentaBancariaId || undefined,
          descripcion: descripcion,
          fecha_pago: updatePagoDto.fecha
            ? new Date(updatePagoDto.fecha)
            : undefined,
        },
        include: {
          detalles_pago: true,
          cuentas_bancarias: true,
        },
      });
    });
    await this.auditoriaService.registrar({
      token,
      idFuncion: 7,
      accion: 'EDITAR',
      descripcion: 'Edición de pago',
      observacion: `Pago ${updated.numero_pago} editado correctamente`,
      ip,
    });

    return this.toEntity(updated);
  }
}
