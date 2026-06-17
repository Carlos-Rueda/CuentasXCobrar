import { Module } from '@nestjs/common';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';
import { FacturacionMockModule } from '../../facturacion-mock/facturacion-mock.module';

@Module({
  imports: [FacturacionMockModule],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService],
})
export class PagosModule {}
