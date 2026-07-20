const { execSync } = require('child_process');

try {
  console.log('=============================================');
  console.log('PM2 SHOW AND ENV VARIABLES INSPECTION');
  console.log('=============================================');

  try {
    const showOutput = execSync('pm2 show backend-cuentas').toString();
    console.log(showOutput);
  } catch (e) {
    console.log('Error running pm2 show:', e.message);
  }

  try {
    const envOutput = execSync('pm2 env 0 || pm2 env 1').toString();
    console.log('\n--- PM2 ENVIRONMENT VARIABLES ---');
    console.log(envOutput);
  } catch (e) {
    console.log('Error running pm2 env:', e.message);
  }

  console.log('=============================================');
} catch (globalErr) {
  console.error('Global error:', globalErr);
}
