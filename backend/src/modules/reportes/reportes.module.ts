import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { DashboardController } from './dashboard.controller';
import { ReportesService } from './reportes.service';
import { FacturasModule } from '../facturas/facturas.module';
import { CuentasCobrarModule } from '../cuentas-cobrar/cuentas-cobrar.module';

@Module({
  imports: [FacturasModule, CuentasCobrarModule],
  controllers: [ReportesController, DashboardController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
