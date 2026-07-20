const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:Lospanas2502%2A@db-backend-cuentas.cm1oqgm0esit.us-east-1.rds.amazonaws.com:5432/cuentasdb?schema=public"
  });
  try {
    await client.connect();
    console.log('\n=============================================');
    console.log('CONTENIDO DE LA TABLA: cuentas_bancarias');
    console.log('=============================================');
    const res = await client.query('SELECT id, entidad_bancaria, nro_cuenta, nombre_cuenta, tipo_cuenta, saldo_inicial, estado FROM cuentas_bancarias');
    console.table(res.rows);
    console.log('=============================================\n');
  } catch (e) {
    console.error('Error al consultar base de datos:', e);
  } finally {
    await client.end();
  }
}
main();
