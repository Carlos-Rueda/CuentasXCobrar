import { Module } from '@nestjs/common';
import { CuentasCobrarController } from './cuentas-cobrar.controller';
import { CuentasCobrarService } from './cuentas-cobrar.service';

@Module({
  controllers: [CuentasCobrarController],
  providers: [CuentasCobrarService],
})
export class CuentasCobrarModule {}
