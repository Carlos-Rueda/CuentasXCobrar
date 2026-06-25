import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';

@ApiTags('Reportes')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('estado-cuenta')
  @ApiOperation({ summary: 'Obtener estado de cuenta de un cliente unificando GraphQL y Prisma' })
  @ApiQuery({ name: 'clienteId', required: true, description: 'ID del cliente' })
  @ApiQuery({ name: 'fechaInicio', required: false, description: 'Fecha de inicio del rango (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fechaFin', required: false, description: 'Fecha de fin del rango (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Estado de cuenta consolidado exitosamente.' })
  async obtenerEstadoCuenta(
    @Query('clienteId') clienteId: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return await this.reportesService.obtenerEstadoCuenta(clienteId, fechaInicio, fechaFin);
  }

  @Get('estado-cuenta/pdf')
  @ApiOperation({ summary: 'Descargar estado de cuenta del cliente en formato PDF' })
  @ApiQuery({ name: 'clienteId', required: true, description: 'ID del cliente' })
  @ApiQuery({ name: 'fechaInicio', required: false, description: 'Fecha de inicio del rango (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fechaFin', required: false, description: 'Fecha de fin del rango (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Documento PDF del estado de cuenta generado.' })
  async descargarEstadoCuentaPdf(
    @Query('clienteId') clienteId: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportesService.generarEstadoCuentaPdf(clienteId, fechaInicio, fechaFin);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=estado-cuenta-${clienteId}.pdf`,
      'Content-Length': buffer.length,
    });

    res.status(HttpStatus.OK).send(buffer);
  }
}
