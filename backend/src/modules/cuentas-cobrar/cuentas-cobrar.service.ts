import { Injectable, NotFoundException } from '@nestjs/common';
import { FacturasService } from '../facturas/facturas.service';
import { PagosService } from '../pagos/pagos.service';
import { EstadoCuentaDto, MovimientoDto } from './dto/estado-cuenta.dto';
import { ValidadorDeudaDto } from './dto/validador-deuda.dto';

@Injectable()
export class CuentasCobrarService {
  constructor(
    private readonly facturacionService: FacturasService,
    private readonly pagosService: PagosService,
  ) {}

  async generarEstadoCuenta(clienteId: string): Promise<EstadoCuentaDto> {
    // 1. Obtener los datos del cliente desde el módulo de Facturación
    const cliente = await this.facturacionService.findOneCliente(clienteId);
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    // 2. Obtener todas las facturas de este cliente
    const facturas = (await this.facturacionService.findAllFacturas()).filter(
      (f) => f.clienteId === clienteId,
    );

    // 3. Obtener pagos reales del cliente desde la base de datos real
    const pagos = await this.pagosService.obtenerReporte();
    const pagosReales = pagos.filter((p) => p.clienteId === clienteId);

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
}
