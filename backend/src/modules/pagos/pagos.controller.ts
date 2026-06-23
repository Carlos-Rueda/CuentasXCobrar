import { Controller, Get, Post, Body, Param, Res, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PagosService } from './pagos.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { PagoEntity } from './pago.entity';

@ApiTags('Pagos / Cobros')
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo cobro/pago' })
  @ApiResponse({
    status: 201,
    description: 'Cobro registrado y facturas actualizadas con éxito.',
  })
  async registrarCobro(@Body() pago: CreatePagoDto) {
    return await this.pagosService.registrarCobro(pago);
  }

  @Get('facturas')
  @ApiOperation({
    summary: 'Obtener facturas simuladas con sus montos pendientes',
  })
  @ApiResponse({ status: 200, description: 'Retorna las facturas en memoria.' })
  async obtenerFacturas() {
    return await this.pagosService.obtenerFacturas();
  }

  @Get('reporte')
  @ApiOperation({
    summary: 'Generar reporte de cobros filtrado por rango de fechas',
  })
  @ApiQuery({
    name: 'fechaInicio',
    required: false,
    description: 'Fecha de inicio del reporte (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'fechaFin',
    required: false,
    description: 'Fecha de fin del reporte (YYYY-MM-DD)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna los cobros/pagos filtrados por rango de fechas.',
    type: [PagoEntity],
  })
  obtenerReporte(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ): PagoEntity[] {
    return this.pagosService.obtenerReporte(fechaInicio, fechaFin);
  }

  @Get('estado-cuenta/:clienteId')
  @ApiOperation({
    summary: 'Consultar estado de cuenta de un cliente',
  })
  @ApiParam({
    name: 'clienteId',
    description: 'ID del cliente',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de cuenta del cliente',
  })
  async obtenerEstadoCuenta(@Param('clienteId') clienteId: string) {
    return await this.pagosService.obtenerEstadoCuenta(clienteId);
  }

  @Get('clientes-deuda')
  @ApiOperation({
    summary: 'Listado de clientes con saldo pendiente',
  })
  async obtenerClientesConDeuda() {
    return await this.pagosService.obtenerClientesConDeuda();
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generar comprobante de cobro en PDF' })
  @ApiParam({
    name: 'id',
    description: 'ID del pago para generar el comprobante',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo PDF del comprobante de cobro.',
  })
  @ApiResponse({ status: 404, description: 'Pago no encontrado.' })
  async generarReciboPdf(@Param('id') id: string, @Res() res: any) {
    const buffer = await this.pagosService.generarReciboPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=recibo-pago.pdf',
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
