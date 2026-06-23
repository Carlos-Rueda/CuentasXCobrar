import { Module } from '@nestjs/common';
import { CxcController } from './cxc.controller';
import { CxcService } from './cxc.service';
import { FacturasModule } from '../modules/facturas/facturas.module'; // Importante para conectar ambos módulos
import { PagosModule } from '../modules/pagos/pagos.module';

@Module({
  imports: [FacturasModule, PagosModule], // 👈 Le da acceso a facturas
  controllers: [CxcController],
  providers: [CxcService],
  exports: [CxcService],
})
export class CxcModule {}