const fs = require('fs');
const { execSync } = require('child_process');

try {
  console.log('=============================================');
  console.log('DIAGNÓSTICO DE VARIABLE DE ENTORNO EN PROCESO PM2');
  console.log('=============================================');

  // Listar procesos corriendo
  try {
    const ps = execSync('ps aux | grep node | grep -v grep').toString();
    console.log('Procesos Node.js en ejecución:\n', ps);
  } catch (e) {
    console.log('No se pudo ejecutar ps aux');
  }

  // Conexiones de red activas al puerto 5432
  try {
    const netstat = execSync('ss -antp | grep 5432 || netstat -an | grep 5432').toString();
    console.log('Conexiones de red activas (puerto 5432):\n', netstat);
  } catch (e) {
    console.log('No se pudo ejecutar ss/netstat:', e.message);
  }

  // Verificar contenedores Docker
  try {
    const dockerPs = execSync('docker ps').toString();
    console.log('Contenedores Docker en ejecución:\n', dockerPs);
  } catch (e) {
    console.log('No se pudo ejecutar docker ps:', e.message);
  }

  // Obtener PIDs de NestJS
  let pids = [];
  try {
    pids = execSync('pgrep -f "main.js"').toString().split('\n').filter(Boolean);
  } catch (e) {
    // Si pgrep falla o no encuentra
  }

  if (pids.length === 0) {
    console.log('No se encontraron procesos de NestJS (main.js) usando pgrep.');
  } else {
    console.log('PIDs de NestJS detectados:', pids);
    pids.forEach(pid => {
      try {
        const envContent = fs.readFileSync(`/proc/${pid}/environ`, 'utf8');
        const envVars = envContent.split('\0');
        const dbUrl = envVars.find(v => v.startsWith('DATABASE_URL='));
        console.log(`-> PID ${pid} DATABASE_URL en memoria:`, dbUrl || 'No definida');
      } catch (err) {
        console.log(`-> No se pudo leer /proc/${pid}/environ:`, err.message);
      }
    });
  }

  // Mostrar logs recientes de PM2
  console.log('\n--- ÚLTIMOS LOGS DE PM2 (backend-cuentas) ---');
  try {
    const logsOut = execSync('tail -n 50 /home/ec2-user/.pm2/logs/backend-cuentas-out-0.log || pm2 logs backend-cuentas --lines 50 --no-daemon').toString();
    console.log(logsOut);
  } catch (e) {
    console.log('No se pudieron leer los logs de PM2:', e.message);
  }

  console.log('=============================================');
} catch (globalErr) {
  console.error('Error global en diagnóstico:', globalErr);
}
