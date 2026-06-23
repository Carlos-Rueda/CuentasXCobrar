import { Module, forwardRef } from '@nestjs/common';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';
import { FacturasModule } from '../facturas/facturas.module';
import { CxcModule } from '../../cxc/cxc.module';

@Module({
  imports: [FacturasModule, forwardRef(() => CxcModule)],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService],
})
export class PagosModule {}
