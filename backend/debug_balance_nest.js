const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { PrismaService } = require('./dist/src/prisma/prisma.service');
const { CuentasBancariasService } = require('./dist/src/modules/cuentas-bancarias/cuentas-bancarias.service');

async function bootstrap() {
  console.log('\n=============================================');
  console.log('INICIANDO CONTEXTO NESTJS PARA DIAGNÓSTICO');
  console.log('=============================================');

  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const service = app.get(CuentasBancariasService);

  console.log('¡Contexto de NestJS levantado con éxito!');

  try {
    // 1. Consultar cuentas
    const cuentas = await prisma.cuentas_bancarias.findMany();
    console.log('\n1. Cuentas bancarias en DB:');
    console.table(cuentas.map(c => ({ id: c.id, banco: c.entidad_bancaria, nro: c.nro_cuenta })));

    // 2. Calcular saldo del Pichincha
    const accountId = 'e0a41753-33df-4999-980b-06c0c27303e8';
    const result = await service.calcularSaldo(accountId);
    console.log('\n2. Saldo calculado para la cuenta principal:', result);

  } catch (err) {
    console.error('\nError durante la consulta a través de NestJS:', err);
  }

  await app.close();
  console.log('=============================================\n');
}

bootstrap().catch(console.error);
