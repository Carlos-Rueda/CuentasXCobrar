const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

console.log("\x1b[36m%s\x1b[0m", "==========================================================");
console.log("\x1b[36m%s\x1b[0m", "🚀 Iniciando Servidores de Desarrollo CXC...");
console.log("\x1b[36m%s\x1b[0m", "   - Backend (NestJS) en http://localhost:3000");
console.log("\x1b[36m%s\x1b[0m", "==========================================================\n");

// 1. Iniciar el Backend (NestJS) en la carpeta backend
const backend = spawn('npm', ['run', 'start:dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

let frontend;
let shuttingDown = false;

backend.on('error', (err) => {
  console.error("❌ Error iniciando el proceso del Backend:", err);
});

backend.on('close', (code) => {
  if (code !== 0 && code !== null && !shuttingDown) {
    console.log(`⚠️  El proceso del Backend se cerró con código de salida: ${code}`);
  }
});

// Helper para verificar si el puerto del Backend ya está abierto
const checkPort = (port, host, callback) => {
  const socket = new net.Socket();
  socket.setTimeout(1000);
  
  socket.on('connect', () => {
    socket.destroy();
    callback(true);
  });
  
  socket.on('timeout', () => {
    socket.destroy();
    callback(false);
  });
  
  socket.on('error', () => {
    socket.destroy();
    callback(false);
  });
  
  socket.connect(port, host);
};

const waitForBackend = (port, host, interval) => {
  checkPort(port, host, (isOpen) => {
    if (isOpen) {
      console.log("\n\x1b[32m%s\x1b[0m", "✅ Backend listo y escuchando en el puerto 3000.");
      console.log("\x1b[36m%s\x1b[0m", "🚀 Iniciando Frontend (Next.js) en http://localhost:3001...\n");
      
      // 2. Iniciar el Frontend (Next.js) en la carpeta frontend
      frontend = spawn('npx', ['next', 'dev', '-p', '3001'], {
        cwd: path.join(__dirname, 'frontend'),
        stdio: 'inherit',
        shell: true
      });

      frontend.on('error', (err) => {
        console.error("❌ Error iniciando el proceso del Frontend:", err);
      });

      frontend.on('close', (code) => {
        if (code !== 0 && code !== null && !shuttingDown) {
          console.log(`⚠️  El proceso del Frontend se cerró con código de salida: ${code}`);
        }
      });
    } else {
      // Seguir esperando
      if (!shuttingDown) {
        setTimeout(() => waitForBackend(port, host, interval), interval);
      }
    }
  });
};

// Esperar a que el Backend compile y abra el puerto 3000 antes de levantar el Frontend
waitForBackend(3000, '127.0.0.1', 500);

// Limpieza de procesos hijos al cerrar el script principal (Ctrl+C)
const cleanup = () => {
  shuttingDown = true;
  console.log("\n\x1b[31m%s\x1b[0m", "🛑 Deteniendo servidores...");
  try {
    backend.kill();
  } catch (e) {}
  try {
    if (frontend) {
      frontend.kill();
    }
  } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
