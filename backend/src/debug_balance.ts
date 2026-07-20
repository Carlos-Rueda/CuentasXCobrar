import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CuentasBancariasService } from './modules/cuentas-bancarias/cuentas-bancarias.service';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const service = app.get(CuentasBancariasService);

  const accountId = 'e0a41753-33df-4999-980b-06c0c27303e8';
  console.log('\n=============================================');
  console.log('DEBUG DE SALDO PARA CUENTA:', accountId);
  console.log('=============================================');

  // 1. Cuenta
  const cuenta = await prisma.cuentas_bancarias.findUnique({ where: { id: accountId } });
  console.log('1. Banco / Cuenta:', cuenta?.entidad_bancaria, '-', cuenta?.nombre_cuenta);

  // 2. Pagos de clientes
  const pagos = await prisma.pagos_clientes.findMany({
    where: { cuenta_bancaria_id: accountId, estado: 'activo' },
    include: { detalles_pago: true }
  });
  let totalPagos = 0;
  pagos.forEach(p => {
    p.detalles_pago.forEach(d => {
      totalPagos += Number(d.monto_pagado);
    });
  });
  console.log('2. Total Ingresos Recaudación Pagos:', totalPagos);

  // 3. Movimientos
  const movimientos = await prisma.movimientos.findMany({
    where: {
      OR: [{ cuenta_origen_id: accountId }, { cuenta_destino_id: accountId }]
    }
  });
  let totalMovs = 0;
  movimientos.forEach(m => {
    const val = Number(m.monto);
    if (m.tipo === 'ingreso' && m.cuenta_destino_id === accountId) totalMovs += val;
    if (m.tipo === 'egreso' && m.cuenta_origen_id === accountId) totalMovs -= val;
    if (m.tipo === 'transferencia') {
      if (m.cuenta_destino_id === accountId) totalMovs += val;
      if (m.cuenta_origen_id === accountId) totalMovs -= val;
    }
  });
  console.log('3. Saldo Neto de Movimientos/Transferencias:', totalMovs);

  // 4. Compras API
  const res = await fetch('http://compras-alb-1632153594.us-east-1.elb.amazonaws.com/api/cxc/gastos');
  const body = await res.json();
  const list = Array.isArray(body) ? body : (body.data || []);
  const listFiltered = list.filter((g: any) => g.cuenta_bancaria_id === accountId);
  const totalCompras = listFiltered.reduce((sum: number, g: any) => sum + Number(g.monto || 0), 0);
  console.log('4. Egresos Compras (API Externa):', totalCompras);
  console.log('   Listado de Compras encontradas para esta cuenta:', JSON.stringify(listFiltered, null, 2));

  // 5. Facturacion API
  const result = await service.calcularSaldo(accountId);
  console.log('5. Resultado Final del Servicio:', result);
  console.log('=============================================\n');

  await app.close();
}

bootstrap().catch(console.error);
