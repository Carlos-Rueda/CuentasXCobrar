import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CuentasCobrarController } from './cuentas-cobrar.controller';
import { CuentasCobrarService } from './cuentas-cobrar.service';
import { FacturasModule } from '../facturas/facturas.module';
import { PagosModule } from '../pagos/pagos.module';
import { FacturacionApiService } from './facturacion-api.service';
import { ComprasApiService } from './compras-api.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AuditoriaInterceptor } from '../interceptors/auditoria.interceptor';

@Module({
  imports: [HttpModule, FacturasModule, forwardRef(() => PagosModule)],
  controllers: [CuentasCobrarController],
  providers: [
    CuentasCobrarService,
    FacturacionApiService,
    ComprasApiService,
    AuditoriaInterceptor,
    { provide: 'AUDITORIA_PACKAGE', useClass: AuditoriaService },
  ],
  exports: [CuentasCobrarService, FacturacionApiService, ComprasApiService],
})
export class CuentasCobrarModule {}

