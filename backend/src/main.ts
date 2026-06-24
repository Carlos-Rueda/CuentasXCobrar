import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  const config = new DocumentBuilder()
    .setTitle('Cuentas por Cobrar API')
    .setDescription(
      'API REST para la gestión de cuentas por cobrar, pagos y cuentas bancarias',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n ===================================================`);
  console.log(` ¡El backend de Cuentas por Cobrar está encendido!`);
  console.log(` Endpoints de la API:   http://localhost:${port}/api`);
  console.log(` Documentación Swagger: http://localhost:${port}/docs`);
  console.log(`===================================================\n`);
}
bootstrap();
