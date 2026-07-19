import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { DashboardController } from './dashboard.controller';
import { ReportesService } from './reportes.service';
import { FacturasModule } from '../facturas/facturas.module';
import { CuentasCobrarModule } from '../cuentas-cobrar/cuentas-cobrar.module';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [FacturasModule, CuentasCobrarModule, AuditoriaModule],
  controllers: [ReportesController, DashboardController],
  providers: [ReportesService, AuditoriaService],
  exports: [ReportesService, AuditoriaService],
})
export class ReportesModule {}
