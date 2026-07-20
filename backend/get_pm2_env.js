const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  console.log('=============================================');
  console.log('DIAGNÓSTICO DE ENTORNO Y CONFIGURACIONES');
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

  // Búsqueda de archivos .env
  console.log('\n--- BÚSQUEDA DE ARCHIVOS .ENV EN EL SERVIDOR ---');
  const rootDir = '/home/ec2-user/CuentasXCobrar';
  const envPaths = [
    '/home/ec2-user/.env',
    path.join(rootDir, '.env'),
    path.join(rootDir, 'backend', '.env'),
    path.join(rootDir, 'frontend', '.env')
  ];
  envPaths.forEach(p => {
    if (fs.existsSync(p)) {
      console.log(`Archivo encontrado en: ${p}`);
      const content = fs.readFileSync(p, 'utf8');
      const dbUrlLine = content.split('\n').find(l => l.includes('DATABASE_URL'));
      console.log(`  -> ${dbUrlLine || 'DATABASE_URL no encontrada en este archivo'}`);
    } else {
      console.log(`Archivo NO existe: ${p}`);
    }
  });

  // Verificar resolución DNS y /etc/hosts
  console.log('\n--- DIAGNÓSTICO DE RESOLUCIÓN DE HOST ---');
  try {
    const dns = require('dns');
    dns.lookup('db-backend-cuentas.cm1oqgm0esit.us-east-1.rds.amazonaws.com', (err, address, family) => {
      if (err) console.log('Error de resolución DNS:', err.message);
      else console.log(`DNS: db-backend-cuentas... resuelve a: ${address}`);
    });
    
    if (fs.existsSync('/etc/hosts')) {
      const hosts = fs.readFileSync('/etc/hosts', 'utf8');
      console.log('Contenido de /etc/hosts:\n', hosts);
    }
  } catch (e) {
    console.log('No se pudo verificar DNS/hosts:', e.message);
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
