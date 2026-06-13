import { Module } from '@nestjs/common';
import { FacturacionMockController } from './facturacion-mock.controller';
import { FacturacionMockService } from './facturacion-mock.service';

@Module({
  controllers: [FacturacionMockController],
  providers: [FacturacionMockService],
  exports: [FacturacionMockService], // Exportamos el servicio para que otros módulos puedan usarlo
})
export class FacturacionMockModule {}