import { Controller, Get, Param, Post, Body, Res } from '@nestjs/common';
import { FacturacionMockService } from './facturacion-mock.service';
import { FacturaMockDto } from './dto/factura-mock.dto';
import { ClienteMockDto } from './dto/cliente-mock.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Simulador Facturación (Mock Externo)')
@Controller('mock-facturacion')
export class FacturacionMockController {
  constructor(private readonly facturacionService: FacturacionMockService) {}

  // Endpoint: GET /mock-facturacion/clientes
  @Get('clientes')
  @ApiOperation({ summary: 'Obtener todos los clientes de facturación' })
  @ApiResponse({ status: 200, description: 'Listado completo de clientes.' })
  getClientes(): ClienteMockDto[] {
    return this.facturacionService.findAllClientes();
  }

  // Endpoint: GET /mock-facturacion/clientes/:id
  @Get('clientes/:id')
  @ApiOperation({ summary: 'Obtener detalles de un cliente por su ID' })
  @ApiParam({ name: 'id', description: 'ID del cliente a buscar', example: 'cli-001' })
  @ApiResponse({ status: 200, description: 'Datos del cliente encontrado.' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado.' })
  getClienteById(@Param('id') id: string): ClienteMockDto {
    return this.facturacionService.findOneCliente(id);
  }

  // Endpoint: GET /mock-facturacion/facturas
  @Get('facturas')
  @ApiOperation({ summary: 'Obtener todas las facturas registradas' })
  @ApiResponse({ status: 200, description: 'Listado completo de facturas.' })
  getFacturas(): FacturaMockDto[] {
    return this.facturacionService.findAllFacturas();
  }

  // Endpoint: GET /mock-facturacion/facturas/:id
  @Get('facturas/:id')
  @ApiOperation({ summary: 'Obtener detalles de una factura específica' })
  @ApiParam({ name: 'id', description: 'ID de la factura a consultar', example: 'fac-101' })
  @ApiResponse({ status: 200, description: 'Datos de la factura.' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada.' })
  getFacturaById(@Param('id') id: string): FacturaMockDto {
    return this.facturacionService.findOneFactura(id);
  }

  // Endpoint: POST /mock-facturacion/facturas
  @Post('facturas')
  @ApiOperation({ summary: 'Registrar una nueva factura' })
  @ApiResponse({ status: 201, description: 'Factura creada con éxito.' })
  crearFactura(@Body() body: any): FacturaMockDto {
    return this.facturacionService.crearFactura(body);
  }

  // Endpoint: GET /mock-facturacion/facturas/:id/pdf
  @Get('facturas/:id/pdf')
  @ApiOperation({ summary: 'Descargar comprobante en PDF de una factura específica' })
  @ApiParam({ name: 'id', description: 'ID de la factura para generar el PDF', example: 'fac-101' })
  @ApiResponse({ status: 200, description: 'Archivo PDF de la factura consultada.' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada.' })
  async generarFacturaPdf(@Param('id') id: string, @Res() res: any) {
    const buffer = await this.facturacionService.generarFacturaPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=factura-${id}.pdf`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // Endpoint: GET /mock-facturacion/clientes/:clienteId/pendientes
  @Get('clientes/:clienteId/pendientes')
  @ApiOperation({ summary: 'Obtener facturas pendientes (por cobrar) de un cliente específico' })
  @ApiParam({ name: 'clienteId', description: 'ID del cliente a consultar', example: 'cli-001' })
  @ApiResponse({ status: 200, description: 'Facturas pendientes obtenidas con éxito.' })
  getPendientesByCliente(@Param('clienteId') clienteId: string): FacturaMockDto[] {
    return this.facturacionService.findFacturasPendientesByCliente(clienteId);
  }
}