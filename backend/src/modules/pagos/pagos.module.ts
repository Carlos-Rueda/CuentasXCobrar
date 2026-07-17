import { Module, forwardRef } from '@nestjs/common';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';
import { FacturasModule } from '../facturas/facturas.module';
import { CuentasCobrarModule } from '../cuentas-cobrar/cuentas-cobrar.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Module({
  imports: [FacturasModule, forwardRef(() => CuentasCobrarModule),AuditoriaModule],
  controllers: [PagosController],
  providers: [PagosService, AuditoriaService],
  exports: [PagosService, AuditoriaService],
})
export class PagosModule {}
