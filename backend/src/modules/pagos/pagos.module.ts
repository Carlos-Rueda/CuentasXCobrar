import { Module, forwardRef } from '@nestjs/common';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';
import { FacturasModule } from '../facturas/facturas.module';
import { CuentasCobrarModule } from '../cuentas-cobrar/cuentas-cobrar.module';

@Module({
  imports: [FacturasModule, forwardRef(() => CuentasCobrarModule)],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService],
})
export class PagosModule {}
