import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CuentasBancariasService } from './cuentas-bancarias.service';
import { CuentasBancariasController, CuentasBancariasSalidaController } from './cuentas-bancarias.controller';
import { AuditoriaService } from '../auditoria/auditoria.service';


@Module({
  imports: [HttpModule],
  controllers: [
    CuentasBancariasController,
    CuentasBancariasSalidaController,
  ],
  providers: [
    CuentasBancariasService,
    AuditoriaService,
  ],
  exports: [CuentasBancariasService],
})
export class CuentasBancariasModule {}
