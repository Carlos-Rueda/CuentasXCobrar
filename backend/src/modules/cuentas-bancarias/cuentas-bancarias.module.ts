import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CuentasBancariasService } from './cuentas-bancarias.service';
import { CuentasBancariasController } from './cuentas-bancarias.controller';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AuditoriaInterceptor } from '../interceptors/auditoria.interceptor';

@Module({
  imports: [HttpModule],
  controllers: [CuentasBancariasController],
  providers: [
    CuentasBancariasService,
    AuditoriaInterceptor,
    { provide: 'AUDITORIA_PACKAGE', useClass: AuditoriaService },
  ],
  exports: [CuentasBancariasService],
})
export class CuentasBancariasModule {}
