import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { FacturacionApiService } from '../cuentas-cobrar/facturacion-api.service';
import { JwtAuthGuard } from '../cuentas-cobrar/jwt-auth.guard';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly facturacionApi: FacturacionApiService,
  ) {}



  @Get('estado-cuenta/detalle')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Obtener estado de cuenta detallado para consumo interno del frontend' })
  @ApiResponse({
    status: 200,
    description: 'Estado de cuenta detallado con historial de transacciones e información separada de CXC y Facturación.',
  })
  async obtenerEstadoCuentaDetallado() {
    const cuentas = await this.prisma.cuentas_bancarias.findMany({
      where: {
        estado: {
          equals: 'activo',
          mode: 'insensitive',
        },
      },
    });

    const reportList = await Promise.all(
      cuentas.map(async (cuenta) => {
        // 1. Sumar recaudación por pagos de clientes
        const pagos = await this.prisma.pagos_clientes.findMany({
          where: {
            cuenta_bancaria_id: cuenta.id,
            estado: {
              equals: 'activo',
              mode: 'insensitive',
            },
          },
          include: {
            detalles_pago: true,
          },
        });

        let ingresos_pagos = 0;
        for (const p of pagos) {
          const sumDetalles = p.detalles_pago.reduce(
            (sum, d) => sum + Number(d.monto_pagado),
            0,
          );
          ingresos_pagos += sumDetalles;
        }

        // 2. Calcular otros movimientos
        const movimientos = await this.prisma.movimientos.findMany({
          where: {
            OR: [
              { cuenta_origen_id: cuenta.id },
              { cuenta_destino_id: cuenta.id },
            ],
          },
          include: {
            cuentas_bancarias_movimientos_cuenta_origen_idTocuentas_bancarias: true,
            cuentas_bancarias_movimientos_cuenta_destino_idTocuentas_bancarias: true,
          },
        });

        const historialTransacciones: any[] = [];

        for (const p of pagos) {
          const totalPago = p.detalles_pago.reduce((sum, d) => sum + Number(d.monto_pagado), 0);
          historialTransacciones.push({
            id: p.id,
            fecha: p.fecha_pago ? p.fecha_pago.toISOString() : (p.created_at ? p.created_at.toISOString() : new Date().toISOString()),
            tipo: 'ingreso',
            referencia: `Cobro N° ${p.numero_pago}`,
            descripcion: p.descripcion || 'Cobro registrado de cliente',
            monto: totalPago,
          });
        }

        let saldo_movimientos = 0;
        for (const mov of movimientos) {
          const monto = Number(mov.monto);
          if (mov.tipo === 'ingreso') {
            if (mov.cuenta_destino_id === cuenta.id) {
              saldo_movimientos += monto;
              historialTransacciones.push({
                id: mov.id,
                fecha: mov.created_at ? mov.created_at.toISOString() : new Date().toISOString(),
                tipo: 'ingreso',
                referencia: 'Ingreso Manual',
                descripcion: mov.descripcion,
                monto: monto,
              });
            }
          } else if (mov.tipo === 'egreso') {
            if (mov.cuenta_origen_id === cuenta.id) {
              saldo_movimientos -= monto;
              historialTransacciones.push({
                id: mov.id,
                fecha: mov.created_at ? mov.created_at.toISOString() : new Date().toISOString(),
                tipo: 'egreso',
                referencia: 'Pago de Servicio',
                descripcion: mov.descripcion,
                monto: monto,
              });
            }
          } else if (mov.tipo === 'transferencia') {
            if (mov.cuenta_destino_id === cuenta.id) {
              saldo_movimientos += monto;
              const nombreOrig = mov.cuentas_bancarias_movimientos_cuenta_origen_idTocuentas_bancarias?.entidad_bancaria || 'Otra Cuenta';
              historialTransacciones.push({
                id: mov.id,
                fecha: mov.created_at ? mov.created_at.toISOString() : new Date().toISOString(),
                tipo: 'ingreso',
                referencia: `Transferencia Recibida`,
                descripcion: `Desde ${nombreOrig} - ${mov.descripcion}`,
                monto: monto,
              });
            }
            if (mov.cuenta_origen_id === cuenta.id) {
              saldo_movimientos -= monto;
              const nombreDest = mov.cuentas_bancarias_movimientos_cuenta_destino_idTocuentas_bancarias?.entidad_bancaria || 'Otra Cuenta';
              historialTransacciones.push({
                id: mov.id,
                fecha: mov.created_at ? mov.created_at.toISOString() : new Date().toISOString(),
                tipo: 'egreso',
                referencia: `Transferencia Enviada`,
                descripcion: `Hacia ${nombreDest} - ${mov.descripcion}`,
                monto: monto,
              });
            }
          }
        }

        historialTransacciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        const saldo_cxc = ingresos_pagos + saldo_movimientos;
        const saldo_facturacion = await this.facturacionApi.obtenerSaldoCuenta(cuenta.id);
        const saldo_total = saldo_cxc + saldo_facturacion;

        return {
          cuentaId: cuenta.id,
          nombreBanco: cuenta.entidad_bancaria,
          numeroCuenta: cuenta.nro_cuenta,
          saldo_cxc,
          saldo_facturacion,
          saldo_total,
          transacciones: historialTransacciones,
        };
      }),
    );

    return reportList;
  }
}
