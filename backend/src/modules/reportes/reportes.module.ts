import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { FacturasModule } from '../facturas/facturas.module';
import { CuentasCobrarModule } from '../cuentas-cobrar/cuentas-cobrar.module';

@Module({
  imports: [FacturasModule, CuentasCobrarModule],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
