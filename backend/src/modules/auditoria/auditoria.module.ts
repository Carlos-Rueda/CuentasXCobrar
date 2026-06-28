import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaInterceptor } from '../interceptors/auditoria.interceptor';

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    AuditoriaService,
    {
      provide: 'AUDITORIA_PACKAGE',
      useClass: AuditoriaService,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditoriaInterceptor,
    },
  ],
  exports: ['AUDITORIA_PACKAGE'],
})
export class AuditoriaModule {}
