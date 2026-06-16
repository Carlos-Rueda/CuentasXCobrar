import { Module } from '@nestjs/common';
import { CxcController } from './cxc.controller';
import { CxcService } from './cxc.service';
import { FacturacionMockModule } from '../facturacion-mock/facturacion-mock.module'; // Importante para conectar ambos módulos

@Module({
  imports: [FacturacionMockModule], // 👈 Le da acceso al simulador de facturas
  controllers: [CxcController],
  providers: [CxcService],
  exports: [CxcService],
})
export class CxcModule {}