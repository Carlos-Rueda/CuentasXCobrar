/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  Query,
  NotFoundException,
} from '@nestjs/common';
import * as express from 'express';
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

@ApiTags('Pagos')
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo pago' })
  @ApiResponse({
    status: 201,
    description: 'Pago registrado y facturas actualizadas con éxito.',
  })
  async registrarCobro(@Body() pago: CreatePagoDto) {
    return await this.pagosService.registrarCobro(pago);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los pagos registrados' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todos los pagos guardados en base de datos.',
    type: [PagoEntity],
  })
  async findAll(): Promise<PagoEntity[]> {
    return await this.pagosService.findAll();
  }

  @Get('facturas')
  @ApiOperation({
    summary:
      'Obtener facturas con sus montos pendientes calculados desde la BD',
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna las facturas con saldo pendiente actual.',
  })
  async obtenerFacturas() {
    return await this.pagosService.obtenerFacturas();
  }

  @Get('reporte')
  @ApiOperation({
    summary: 'Generar reporte de pagos filtrado por rango de fechas',
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
    description: 'Retorna los pagos filtrados por rango de fechas.',
    type: [PagoEntity],
  })
  async obtenerReporte(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ): Promise<PagoEntity[]> {
    return await this.pagosService.obtenerReporte(fechaInicio, fechaFin);
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

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un pago específico por ID con datos del cliente',
  })
  @ApiParam({ name: 'id', description: 'ID del pago a buscar' })
  @ApiResponse({ status: 200, description: 'Datos del pago y del cliente.' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado.' })
  async findOne(@Param('id') id: string) {
    const pago = await this.pagosService.findOne(id);
    if (!pago) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }
    return pago;
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generar comprobante de pago en PDF' })
  @ApiParam({
    name: 'id',
    description: 'ID del pago para generar el comprobante',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo PDF del comprobante de pago.',
  })
  @ApiResponse({ status: 404, description: 'Pago no encontrado.' })
  async generarReciboPdf(@Param('id') id: string, @Res() res: express.Response) {
    const buffer = await this.pagosService.generarComprobantePdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=comprobante-pago.pdf',
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
