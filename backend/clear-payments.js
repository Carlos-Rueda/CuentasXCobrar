require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  console.log('Conectando a la base de datos...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Iniciando borrado de pagos...');
    
    // Iniciar transacción SQL
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Borrar detalles_pago
      const resDetails = await client.query('DELETE FROM detalles_pago');
      console.log(`Se eliminaron ${resDetails.rowCount} detalles de pago.`);

      // Borrar movimientos
      const resMovimientos = await client.query('DELETE FROM movimientos');
      console.log(`Se eliminaron ${resMovimientos.rowCount} movimientos.`);

      // Borrar pagos_clientes
      const resPagos = await client.query('DELETE FROM pagos_clientes');
      console.log(`Se eliminaron ${resPagos.rowCount} pagos de clientes.`);

      await client.query('COMMIT');
      console.log('Reinicio de secuenciales completado con éxito. El siguiente pago será PAG-CLI-00001.');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error al borrar los pagos:', error);
  } finally {
    await pool.end();
  }
}

main();
