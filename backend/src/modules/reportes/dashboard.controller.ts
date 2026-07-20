import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { FacturacionApiService } from '../cuentas-cobrar/facturacion-api.service';
import { ComprasApiService } from '../cuentas-cobrar/compras-api.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly facturacionApi: FacturacionApiService,
    private readonly comprasApi: ComprasApiService,
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

    // Obtener gastos del módulo de compras
    const gastosCompras = await this.comprasApi.obtenerGastos();


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

        const transferencias: any[] = [];
        const pagosExternos: any[] = [];
        const pagosRecaudadosCxc: any[] = [];
        const ingresosManuales: any[] = [];
        const comprasEgresos: any[] = [];

        // Mapear gastos de compras (con comparación segura de UUIDs sin distinción de mayúsculas/minúsculas)
        const gastosCuenta = gastosCompras.filter(
          (g) => g.cuenta_bancaria_id?.toLowerCase().trim() === cuenta.id.toLowerCase().trim()
        );
        const total_compras = gastosCuenta.reduce((sum, g) => sum + Number(g.monto || 0), 0);


        for (const g of gastosCuenta) {
          comprasEgresos.push({
            id: `compra-${g.id}`,
            fecha: g.fecha_registro || g.fecha_pago || new Date().toISOString(),
            tipo: 'egreso',
            referencia: `Compra No. ${g.id}`,
            descripcion: g.detalle || g.motivo || 'Gasto registrado de compras',
            monto: Number(g.monto || 0),
          });
        }

        for (const p of pagos) {
          const totalPago = p.detalles_pago.reduce((sum, d) => sum + Number(d.monto_pagado), 0);
          pagosRecaudadosCxc.push({
            id: p.id,
            fecha: p.fecha_pago ? p.fecha_pago.toISOString() : (p.created_at ? p.created_at.toISOString() : new Date().toISOString()),
            tipo: 'ingreso',
            referencia: `Cobro No. ${p.numero_pago}`,
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
              ingresosManuales.push({
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
              pagosExternos.push({
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
              const cbOr = mov.cuentas_bancarias_movimientos_cuenta_origen_idTocuentas_bancarias;
              const nombreOrig = cbOr?.entidad_bancaria || 'Otra Cuenta';
              const nroOrig = cbOr?.nro_cuenta ? `(No. ${cbOr.nro_cuenta})` : '';
              transferencias.push({
                id: mov.id,
                fecha: mov.created_at ? mov.created_at.toISOString() : new Date().toISOString(),
                tipo: 'ingreso',
                referencia: `Transferencia Recibida`,
                descripcion: `Desde ${nombreOrig} ${nroOrig} - ${mov.descripcion}`,
                monto: monto,
              });
            }
            if (mov.cuenta_origen_id === cuenta.id) {
              saldo_movimientos -= monto;
              const cbDest = mov.cuentas_bancarias_movimientos_cuenta_destino_idTocuentas_bancarias;
              const nombreDest = cbDest?.entidad_bancaria || 'Otra Cuenta';
              const nroDest = cbDest?.nro_cuenta ? `(No. ${cbDest.nro_cuenta})` : '';
              transferencias.push({
                id: mov.id,
                fecha: mov.created_at ? mov.created_at.toISOString() : new Date().toISOString(),
                tipo: 'egreso',
                referencia: `Transferencia Enviada`,
                descripcion: `Hacia ${nombreDest} ${nroDest} - ${mov.descripcion}`,
                monto: monto,
              });
            }
          }
        }

        const sortByDate = (arr: any[]) => arr.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        sortByDate(transferencias);
        sortByDate(pagosExternos);
        sortByDate(pagosRecaudadosCxc);
        sortByDate(ingresosManuales);
        sortByDate(comprasEgresos);

        const saldo_cxc = ingresos_pagos + saldo_movimientos - total_compras;
        const saldo_facturacion = await this.facturacionApi.obtenerSaldoCuenta(cuenta.id);
        const saldo_total = saldo_cxc + saldo_facturacion;

        return {
          cuentaId: cuenta.id,
          nombreBanco: cuenta.entidad_bancaria,
          numeroCuenta: cuenta.nro_cuenta,
          nombreCuenta: cuenta.nombre_cuenta,
          tipoCuenta: cuenta.tipo_cuenta,
          saldo_cxc,
          saldo_facturacion,
          saldo_total,
          transferencias,
          pagosExternos,
          pagosRecaudadosCxc,
          ingresosManuales,
          comprasEgresos,
        };
      }),
    );

    return reportList;
  }
}
