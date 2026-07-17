import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/cuentas-cobrar/jwt-auth.guard';
import { AuditoriaService } from './auditoria.service';

@ApiTags('Auditoría')
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Post('frontend')
  @ApiBearerAuth()
  async registrar(@Body() body: any, @Req() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    let ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      req.ip;

    if (ip === '::1') {
      ip = '127.0.0.1';
    }

    await this.auditoriaService.registrar({
      token,
      idFuncion: body.idFuncion,
      accion: body.accion,
      descripcion: body.descripcion,
      observacion: body.observacion,
      ip,
    });

    return {
      success: true,
      message: 'Auditoría registrada correctamente',
    };
  }
}
