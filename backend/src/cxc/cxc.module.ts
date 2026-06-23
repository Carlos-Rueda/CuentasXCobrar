import { Module } from '@nestjs/common';
import { CxcController } from './cxc.controller';
import { CxcService } from './cxc.service';
import { FacturasModule } from '../modules/facturas/facturas.module';
import { PagosModule } from '../modules/pagos/pagos.module';
import { FacturacionApiService } from './facturacion-api.service';

@Module({
  imports: [FacturasModule, PagosModule],
  controllers: [CxcController],
  providers: [CxcService, FacturacionApiService],
  exports: [CxcService, FacturacionApiService],
})
export class CxcModule {}
