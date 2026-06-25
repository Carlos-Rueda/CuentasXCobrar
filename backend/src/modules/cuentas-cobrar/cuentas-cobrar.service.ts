import { Injectable, NotFoundException } from '@nestjs/common';
import { FacturasService } from '../facturas/facturas.service';
import { PagosService } from '../pagos/pagos.service';
import { EstadoCuentaDto, MovimientoDto } from './dto/estado-cuenta.dto';
import { ValidadorDeudaDto } from './dto/validador-deuda.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { FacturacionApiService } from './facturacion-api.service';

@Injectable()
export class CuentasCobrarService {
  constructor(
    private readonly facturacionService: FacturasService,
    private readonly pagosService: PagosService,
    private readonly prismaService: PrismaService,
    private readonly facturacionApiService: FacturacionApiService,
  ) {}

  async generarEstadoCuenta(clienteId: string): Promise<EstadoCuentaDto> {
    // 1. Obtener los datos del cliente desde el módulo de Facturación
    const cliente = await this.facturacionService.findOneCliente(clienteId);
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    // 2. Obtener todas las facturas de este cliente
    const facturas = (await this.facturacionService.findAllFacturas()).filter(
      (f) => f.clienteId === clienteId,
    );

    // 3. Obtener pagos reales del cliente desde la base de datos real (solo en estado 'activo')
    const pagos = await this.pagosService.obtenerReporte();
    const pagosReales = pagos.filter((p) => p.clienteId === clienteId && p.estado === 'activo');

    // 4. Procesar el Historial de Movimientos (Cruzar Facturas y Pagos)
    const historial: MovimientoDto[] = [];
    let totalFacturado = 0;
    let totalPagado = 0;

    // Registrar las facturas como DÉBITOS (Deudas)
    facturas.forEach((f) => {
      totalFacturado += f.total;
      historial.push({
        fecha: f.fechaEmision,
        documento: `Factura N° ${f.numero}`,
        tipo: 'DEBITO',
        monto: f.total,
      });
    });

    // Registrar los pagos de este cliente como CRÉDITOS (Abonos)
    pagosReales.forEach((p) => {
      totalPagado += p.montoTotal;
      historial.push({
        fecha: p.fecha.split('T')[0],
        documento: `Abono/Pago Ref: PAG-${p.id}`,
        tipo: 'CREDITO',
        monto: p.montoTotal,
      });
    });

    // Ordenar el historial por fecha para que sea cronológico
    historial.sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );

    // 5. Calcular el Saldo Pendiente Neto del cliente
    const saldoPendiente = totalFacturado - totalPagado;

    // 6. Retornar el Estado de Cuenta estructurado
    return {
      clienteId: cliente.id,
      nombreCliente: cliente.nombre,
      ruc: cliente.ruc,
      totalFacturado,
      totalPagado,
      saldoPendiente,
      historial,
    };
  }

  async validarDeudaCliente(clienteId: string): Promise<ValidadorDeudaDto> {
    // 1. Calculamos la deuda real neta restando los pagos
    const cxcInfo = await this.generarEstadoCuenta(clienteId);
    const montoTotalDeuda = Math.max(0, cxcInfo.saldoPendiente);
    const tieneDeudaActiva = montoTotalDeuda > 0;

    // 2. Regla de negocio simulada: Si debe más de $500, se bloquea.
    let estadoCliente: 'APTO_PARA_CREDITO' | 'BLOQUEADO_POR_MORA' =
      'APTO_PARA_CREDITO';
    let mensaje =
      'El cliente no registra deudas críticas. Apto para operaciones.';

    if (montoTotalDeuda > 500) {
      estadoCliente = 'BLOQUEADO_POR_MORA';
      mensaje = `El cliente supera el cupo de deuda permitido ($500). Operaciones bloqueadas. Deuda actual: $${montoTotalDeuda.toFixed(2)}`;
    } else if (tieneDeudaActiva) {
      mensaje = `El cliente posee deudas pendientes por un valor de $${montoTotalDeuda.toFixed(2)}, pero está dentro del límite autorizado.`;
    }

    return {
      clienteId,
      tieneDeudaActiva,
      montoTotalDeuda,
      estadoCliente,
      mensaje,
    };
  }

  async getClientesSaldos() {
    // 1. Consulta a GraphQL los clientes y sus facturas a crédito
    const clientes = await this.facturacionApiService.obtenerClientes();
    const facturas = await this.facturacionApiService.obtenerFacturas();

    // Filtramos para obtener las facturas a crédito o con estado PENDIENTE.
    // Si la base de datos de pruebas no posee facturas con esa clasificación explícita,
    // tomamos todas las facturas para calcular el saldo pendiente real de cada cliente.
    let facturasFiltradas = facturas.filter(
      (f) => f.tipoPago?.toUpperCase() === 'CREDITO' || f.estado?.toUpperCase() === 'PENDIENTE',
    );
    if (facturasFiltradas.length === 0) {
      facturasFiltradas = facturas;
    }

    // 2. Consulta en Prisma los detalles de pago para obtener los abonos realizados a esas facturas.
    // Únicamente consideramos abonos asociados a pagos en estado 'activo'.
    const detallesPago = await this.prismaService.detalles_pago.findMany({
      where: {
        pagos_clientes: {
          estado: 'activo',
        },
      },
      select: {
        factura_id: true,
        monto_pagado: true,
      },
    });

    const abonosPorFactura = new Map<string, number>();
    for (const det of detallesPago) {
      const current = abonosPorFactura.get(det.factura_id) || 0;
      abonosPorFactura.set(det.factura_id, current + Number(det.monto_pagado));
    }

    // 3. Restamos los abonos al total facturado y filtramos los clientes con saldoPendiente > 0
    const data = clientes
      .map((cliente) => {
        const facturasCliente = facturasFiltradas.filter(
          (f) => f.clienteId === cliente.id,
        );

        let totalFacturado = 0;
        let totalAbonado = 0;

        for (const f of facturasCliente) {
          totalFacturado += Number(f.total);
          totalAbonado += abonosPorFactura.get(f.id) || 0;
        }

        const saldoPendiente = Number((totalFacturado - totalAbonado).toFixed(2));

        return {
          clienteId: cliente.id,
          cedula: cliente.cedula,
          nombre: cliente.nombre,
          saldoPendiente,
        };
      })
      .filter((c) => c.saldoPendiente > 0);

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
