module.exports = {
  apps: [
    {
      name: 'backend-cuentas',
      script: 'dist/src/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:Lospanas2502%2A@db-backend-cuentas.cm1oqgm0esit.us-east-1.rds.amazonaws.com:5432/cuentasdb?schema=public',
      },
    },
  ],
};
