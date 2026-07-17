import { Controller, Get, Query, Res, Req, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';

@ApiTags('Reportes')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('estado-cuenta')
  @ApiOperation({
    summary:
      'Obtener estado de cuenta de un cliente unificando GraphQL y Prisma',
  })
  @ApiQuery({
    name: 'clienteId',
    required: true,
    description: 'ID del cliente',
  })
  @ApiQuery({
    name: 'fechaInicio',
    required: false,
    description: 'Fecha de inicio del rango (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'fechaFin',
    required: false,
    description: 'Fecha de fin del rango (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de cuenta consolidado exitosamente.',
  })
  async obtenerEstadoCuenta(
    @Query('clienteId') clienteId: string,
    @Req() req,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    let ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      '127.0.0.1';

    if (ip === '::1') {
      ip = '127.0.0.1';
    }

    return await this.reportesService.obtenerEstadoCuenta(
      clienteId,
      fechaInicio,
      fechaFin,
      token,
      ip,
    );
  }

  @Get('estado-cuenta/pdf')
  async descargarEstadoCuentaPdf(
    @Query('clienteId') clienteId: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Req() req,
    @Res() res: Response,
  ) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    let ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      '127.0.0.1';

    if (ip === '::1') {
      ip = '127.0.0.1';
    }

    const buffer = await this.reportesService.generarEstadoCuentaPdf(
      clienteId,
      fechaInicio,
      fechaFin,
      token,
      ip,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=estado-cuenta-${clienteId}.pdf`,
      'Content-Length': buffer.length,
    });

    res.status(HttpStatus.OK).send(buffer);
  }
}
