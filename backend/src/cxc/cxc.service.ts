import { Injectable, NotFoundException } from '@nestjs/common';
import { FacturacionMockService } from '../facturacion-mock/facturacion-mock.service';
import { EstadoCuentaDto, MovimientoDto } from './dto/estado-cuenta.dto';
import { ValidadorDeudaDto } from './dto/validador-deuda.dto';

@Injectable()
export class CxcService {
  constructor(
    private readonly facturacionService: FacturacionMockService,
    // Aquí inyectarías tu repositorio de base de datos Postgres (ej: Prisma o TypeORM)
    // private prisma: PrismaService 
  ) {}

  async generarEstadoCuenta(clienteId: string): Promise<EstadoCuentaDto> {
    // 1. Obtener los datos del cliente desde el módulo de Facturación (Mock)
    const cliente = this.facturacionService.findOneCliente(clienteId);
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    // 2. Obtener todas las facturas de este cliente (Mock)
    const facturas = this.facturacionService.findAllFacturas()
      .filter(f => f.clienteId === clienteId);

    // 3. SIMULACIÓN DE PAGOS DESDE TU BASE DE DATOS REAL (Postgres)
    // En producción aquí harías: const pagos = await this.prisma.pago.findMany({ where: { clienteId } });
    const pagosSimuladosEnPostgres = [
      { id: 'pag-501', facturaId: 'fac-101', fecha: '2026-06-03', monto: 50.00, recibo: 'REC-001' },
      { id: 'pag-502', facturaId: 'fac-101', fecha: '2026-06-08', monto: 100.00, recibo: 'REC-002' }, // Completó la fac-101
      { id: 'pag-503', facturaId: 'fac-104', fecha: '2026-06-15', monto: 100.00, recibo: 'REC-003' }, // Abono parcial a fac-104
      { id: 'pag-504', facturaId: 'fac-105', fecha: '2026-06-13', monto: 480.00, recibo: 'REC-004' }, // Completó la fac-105
      { id: 'pag-505', facturaId: 'fac-107', fecha: '2026-06-10', monto: 120.00, recibo: 'REC-005' }  // Abono parcial a fac-107
    ];

    // 4. Procesar el Historial de Movimientos (Cruzar Facturas y Pagos)
    const historial: MovimientoDto[] = [];
    let totalFacturado = 0;
    let totalPagado = 0;

    // Registrar las facturas como DÉBITOS (Deudas)
    facturas.forEach(f => {
      totalFacturado += f.total;
      historial.push({
        fecha: f.fechaEmision,
        documento: `Factura N° ${f.numero}`,
        tipo: 'DEBITO',
        monto: f.total
      });
    });

    // Registrar los pagos de este cliente como CRÉDITOS (Abonos)
    const pagosDelCliente = pagosSimuladosEnPostgres.filter(p =>
      facturas.some(f => f.id === p.facturaId)
    );

    pagosDelCliente.forEach(p => {
      totalPagado += p.monto;
      historial.push({
        fecha: p.fecha,
        documento: `Abono/Pago Ref: ${p.recibo}`,
        tipo: 'CREDITO',
        monto: p.monto
      });
    });

    // Ordenar el historial por fecha para que sea cronológico
    historial.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

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
      historial
    };
  }
  async validarDeudaCliente(clienteId: string): Promise<ValidadorDeudaDto> {
    // 1. Calculamos la deuda real neta restando los pagos
    const cxcInfo = await this.generarEstadoCuenta(clienteId);
    const montoTotalDeuda = Math.max(0, cxcInfo.saldoPendiente);
    const tieneDeudaActiva = montoTotalDeuda > 0;
    
    // 2. Regla de negocio simulada: Si debe más de $500, se bloquea.
    let estadoCliente: 'APTO_PARA_CREDITO' | 'BLOQUEADO_POR_MORA' = 'APTO_PARA_CREDITO';
    let mensaje = 'El cliente no registra deudas críticas. Apto para operaciones.';

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
      mensaje
    };
  }
}