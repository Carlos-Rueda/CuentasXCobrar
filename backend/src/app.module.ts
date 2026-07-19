import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FacturasModule } from './modules/facturas/facturas.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { CuentasCobrarModule } from './modules/cuentas-cobrar/cuentas-cobrar.module';
import { CuentasBancariasModule } from './modules/cuentas-bancarias/cuentas-bancarias.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { AuthModule } from './modules/auth/auth.module';
import { MovimientosModule } from './modules/movimientos/movimientos.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { FunctionGuard } from './modules/auth/guards/function.guard';

@Module({
  imports: [
    PrismaModule,
    AuditoriaModule,
    FacturasModule,
    PagosModule,
    CuentasCobrarModule,
    CuentasBancariasModule,
    ReportesModule,
    AuthModule,
    MovimientosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: FunctionGuard,
    },
  ],
})
export class AppModule {}
