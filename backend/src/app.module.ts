import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { FacturasModule } from './modules/facturas/facturas.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { CuentasCobrarModule } from './modules/cuentas-cobrar/cuentas-cobrar.module';

@Module({
  imports: [AuthModule, ClientesModule, FacturasModule, PagosModule, CuentasCobrarModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
