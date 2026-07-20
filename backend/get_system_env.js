const fs = require('fs');
const path = require('path');

console.log('=============================================');
console.log('DIAGNÓSTICO DE VARIABLES DE ENTORNO EN SYSTEM FILES');
console.log('=============================================');

const files = [
  '/home/ec2-user/.bashrc',
  '/home/ec2-user/.bash_profile',
  '/etc/environment',
  '/etc/profile',
  '/home/ec2-user/CuentasXCobrar/backend/.env'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    console.log(`\nArchivo: ${f}`);
    try {
      const content = fs.readFileSync(f, 'utf8');
      const lines = content.split('\n');
      lines.forEach(line => {
        if (line.includes('GRAPHQL') || line.includes('URL') || line.includes('API') || line.includes('HOST')) {
          console.log(`  -> ${line.trim()}`);
        }
      });
    } catch (e) {
      console.log(`  -> Error al leer: ${e.message}`);
    }
  } else {
    console.log(`\nArchivo NO existe: ${f}`);
  }
});

console.log('=============================================');
