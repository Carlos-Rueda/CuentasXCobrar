const { spawn } = require('child_process');
const path = require('path');

console.log("\x1b[36m%s\x1b[0m", "==========================================================");
console.log("\x1b[36m%s\x1b[0m", "🚀 Iniciando Servidores de Desarrollo CXC...");
console.log("\x1b[36m%s\x1b[0m", "   - Backend (NestJS) en http://localhost:3000");
console.log("\x1b[36m%s\x1b[0m", "   - Frontend (Next.js) en http://localhost:3001");
console.log("\x1b[36m%s\x1b[0m", "==========================================================\n");

// 1. Iniciar el Backend (NestJS) en la carpeta backend
const backend = spawn('npm', ['run', 'start:dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

backend.on('error', (err) => {
  console.error("❌ Error iniciando el proceso del Backend:", err);
});

backend.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`⚠️  El proceso del Backend se cerró con código de salida: ${code}`);
  }
});

// 2. Iniciar el Frontend (Next.js) en la carpeta frontend, usando npx next dev directamente
const frontend = spawn('npx', ['next', 'dev', '-p', '3001'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

frontend.on('error', (err) => {
  console.error("❌ Error iniciando el proceso del Frontend:", err);
});

frontend.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`⚠️  El proceso del Frontend se cerró con código de salida: ${code}`);
  }
});

// Limpieza de procesos hijos al cerrar el script principal (Ctrl+C)
const cleanup = () => {
  console.log("\n\x1b[31m%s\x1b[0m", "🛑 Deteniendo servidores...");
  try {
    backend.kill();
  } catch (e) {}
  try {
    frontend.kill();
  } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

