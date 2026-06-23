import { Controller, Get, Post, Param, Body, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { FacturasService } from './facturas.service';
import { ClienteDto } from './dto/cliente.dto';
import { FacturaDto } from './dto/factura.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import * as express from 'express';

@ApiTags('Facturación (Integración GraphQL Real)')
@Controller('facturas')
export class FacturasController {
  constructor(private readonly facturasService: FacturasService) {}

  @Get('clientes')
  @ApiOperation({ summary: 'Obtener todos los clientes de facturación' })
  @ApiResponse({ status: 200, description: 'Listado completo de clientes.', type: [ClienteDto] })
  async getClientes(): Promise<ClienteDto[]> {
    return await this.facturasService.findAllClientes();
  }

  @Get('clientes/:id')
  @ApiOperation({ summary: 'Obtener detalles de un cliente por su ID' })
  @ApiParam({ name: 'id', description: 'ID del cliente a buscar', example: 'cli-001' })
  @ApiResponse({ status: 200, description: 'Datos del cliente encontrado.', type: ClienteDto })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado.' })
  async getClienteById(@Param('id') id: string): Promise<ClienteDto> {
    return await this.facturasService.findOneCliente(id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las facturas registradas' })
  @ApiResponse({ status: 200, description: 'Listado completo de facturas.', type: [FacturaDto] })
  async getFacturas(): Promise<FacturaDto[]> {
    return await this.facturasService.findAllFacturas();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una factura por su ID' })
  @ApiParam({ name: 'id', description: 'ID de la factura a buscar', example: 'fac-101' })
  @ApiResponse({ status: 200, description: 'Datos de la factura encontrada.', type: FacturaDto })
  @ApiResponse({ status: 404, description: 'Factura no encontrada.' })
  async getFacturaById(@Param('id') id: string): Promise<FacturaDto> {
    return await this.facturasService.findOneFactura(id);
  }

  @Get('clientes/:clienteId/pendientes')
  @ApiOperation({ summary: 'Obtener facturas pendientes de un cliente' })
  @ApiParam({ name: 'clienteId', description: 'ID del cliente a consultar', example: 'cli-001' })
  @ApiResponse({ status: 200, description: 'Listado de facturas con estado PENDIENTE.', type: [FacturaDto] })
  async getPendientes(@Param('clienteId') clienteId: string): Promise<FacturaDto[]> {
    return await this.facturasService.findFacturasPendientesByCliente(clienteId);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar/Crear una nueva factura' })
  @ApiResponse({ status: 201, description: 'Factura creada exitosamente.', type: FacturaDto })
  async crearFactura(@Body() body: any): Promise<FacturaDto> {
    return await this.facturasService.crearFactura(body);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generar comprobante PDF de la factura' })
  @ApiParam({ name: 'id', description: 'ID de la factura para el PDF', example: 'fac-101' })
  @ApiResponse({ status: 200, description: 'Retorna el archivo PDF en binario.' })
  async generarPdf(@Param('id') id: string, @Res() res: express.Response): Promise<void> {
    const pdfBuffer = await this.facturasService.generarFacturaPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=factura-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
