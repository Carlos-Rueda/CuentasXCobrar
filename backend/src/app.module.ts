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

@Module({
  imports: [
    PrismaModule,
    AuditoriaModule,
    FacturasModule,
    PagosModule,
    CuentasCobrarModule,
    CuentasBancariasModule,
    ReportesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
