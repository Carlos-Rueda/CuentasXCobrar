const { spawn } = require('child_process');

console.log("=== DIAGNOSTIC STARTUP SCRIPT ===");
console.log("Cwd:", process.cwd());
console.log("Node version:", process.version);
console.log("Port Env:", process.env.PORT);

// Iniciar next start usando npx
const nextProcess = spawn('npx', ['next', 'start', '-H', '0.0.0.0'], {
  stdio: 'inherit',
  shell: true
});

nextProcess.on('error', (err) => {
  console.error("!!! ERROR starting Next.js process:", err);
});

nextProcess.on('exit', (code, signal) => {
  console.log(`!!! Next.js process exited. Code: ${code}, Signal: ${signal}`);
  process.exit(code !== null ? code : 1);
});
