import { Controller, Get, Param } from '@nestjs/common';
import { CxcService } from './cxc.service';

@Controller('cxc') // 👈 Esto define la primera parte: /cxc
export class CxcController {
  constructor(private readonly cxcService: CxcService) {}

  @Get('estado-cuenta/:clienteId') // 👈 Esto define el resto: /estado-cuenta/cli-001
  obtenerEstadoCuenta(@Param('clienteId') clienteId: string) {
    return this.cxcService.generarEstadoCuenta(clienteId);
  }
}

