const { PrismaClient } = require('./dist/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL no está definida en el archivo .env');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

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
  const listFiltered = list.filter(g => g.cuenta_bancaria_id === accountId);
  const totalCompras = listFiltered.reduce((sum, g) => sum + Number(g.monto || 0), 0);
  console.log('4. Egresos Compras (API Externa):', totalCompras);
  console.log('   Listado de Compras encontradas para esta cuenta:', JSON.stringify(listFiltered, null, 2));

  // 5. Facturacion API (Simulado)
  let saldo_facturacion = 0;
  try {
    const apiKey = process.env.FACTURACION_API_KEY || 'api_key_facturacion_cxc_2026';
    const graphqlUrl = process.env.FACTURACION_GRAPHQL_URL || 'https://ad-modulo-facturacion-e51e.onrender.com/graphql';

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const gqlQuery = {
      query: `
        query SaldoCuenta($cuentaId: ID!) {
          saldoCuenta(cuentaId: $cuentaId) {
            saldoActual
          }
        }
      `,
      variables: { cuentaId: accountId },
    };

    const gqlRes = await fetch(graphqlUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(gqlQuery),
    });

    if (gqlRes.ok) {
      const gqlBody = await gqlRes.json();
      saldo_facturacion = gqlBody?.data?.saldoCuenta?.saldoActual || 0;
    }
  } catch (e) {
    console.error('Error al obtener saldo facturacion:', e);
  }
  console.log('5. Saldo Facturación (API Externa):', saldo_facturacion);

  const saldo_cxc = totalPagos + totalMovs - totalCompras;
  const saldo_total = saldo_cxc + saldo_facturacion;
  console.log('---------------------------------------------');
  console.log('Saldo CxC calculado:', saldo_cxc);
  console.log('Saldo Total (CxC + Facturación):', saldo_total);
  console.log('=============================================\n');

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (err) => {
  console.error('\nError durante la ejecución del script:', err);
  console.log('\n--- DIAGNÓSTICO DE TABLAS EN LA BASE DE DATOS ---');
  try {
    console.log('DATABASE_URL real en process.env:', process.env.DATABASE_URL);
    const { Pool } = require('pg');
    
    // Probar primero con la URL actual
    const connectionString = process.env.DATABASE_URL || "postgresql://postgres:Lospanas2502%2A@db-backend-cuentas.cm1oqgm0esit.us-east-1.rds.amazonaws.com:5432/cuentasdb?schema=public";
    
    // Probar con base de datos 'postgres'
    const postgresUrl = connectionString.replace('/cuentasdb', '/postgres');
    console.log('Probando diagnóstico en la base de datos "postgres"...');
    
    const pool = new Pool({
      connectionString: postgresUrl,
      ssl: { rejectUnauthorized: false }
    });
    const tablesQuery = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name;
    `);
    console.log('Tablas y Esquemas encontrados en "postgres":');
    console.table(tablesQuery.rows);

    const dbQuery = await pool.query("SELECT datname FROM pg_database WHERE datistemplate = false;");
    console.log('Bases de datos en el servidor:');
    console.table(dbQuery.rows);

    await pool.end();
  } catch (dbErr) {
    console.error('No se pudo listar las tablas para diagnóstico:', dbErr);
  }
  process.exit(1);
});
