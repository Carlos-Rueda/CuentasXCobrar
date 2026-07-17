import { Module } from '@nestjs/common';
import { MovimientosController } from './movimientos.controller';
import { MovimientosService } from './movimientos.service';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Module({
  imports: [AuditoriaModule],
  controllers: [MovimientosController],   
  providers: [MovimientosService, AuditoriaService],
  exports: [MovimientosService, AuditoriaService],
})
export class MovimientosModule { }
