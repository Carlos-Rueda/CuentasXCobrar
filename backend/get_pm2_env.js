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
  console.log('=============================================');
} catch (globalErr) {
  console.error('Error global en diagnóstico:', globalErr);
}
