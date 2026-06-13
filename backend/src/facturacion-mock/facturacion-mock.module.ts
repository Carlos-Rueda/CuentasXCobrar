import { Module } from '@nestjs/common';
import { FacturacionMockController } from './facturacion-mock.controller';
import { FacturacionMockService } from './facturacion-mock.service';

@Module({
  controllers: [FacturacionMockController],
  providers: [FacturacionMockService],
})
export class FacturacionMockModule {}