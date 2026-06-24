import { Module, forwardRef } from '@nestjs/common';
import { CuentasCobrarController } from './cuentas-cobrar.controller';
import { CuentasCobrarService } from './cuentas-cobrar.service';
import { FacturasModule } from '../facturas/facturas.module';
import { PagosModule } from '../pagos/pagos.module';
import { FacturacionApiService } from './facturacion-api.service';

@Module({
  imports: [FacturasModule, forwardRef(() => PagosModule)],
  controllers: [CuentasCobrarController],
  providers: [CuentasCobrarService, FacturacionApiService],
  exports: [CuentasCobrarService, FacturacionApiService],
})
export class CuentasCobrarModule {}
