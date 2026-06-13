import { Controller, Get, Param } from '@nestjs/common';
import { FacturacionMockService } from './facturacion-mock.service';
import { FacturaMockDto } from './dto/factura-mock.dto';
import { ClienteMockDto } from './dto/cliente-mock.dto';

@Controller('mock-facturacion')
export class FacturacionMockController {
  constructor(private readonly facturacionService: FacturacionMockService) {}

  // Endpoint: GET /mock-facturacion/clientes
  @Get('clientes')
  getClientes(): ClienteMockDto[] {
    return this.facturacionService.findAllClientes();
  }

  // Endpoint: GET /mock-facturacion/clientes/:id
  @Get('clientes/:id')
  getClienteById(@Param('id') id: string): ClienteMockDto {
    return this.facturacionService.findOneCliente(id);
  }

  // Endpoint: GET /mock-facturacion/facturas
  @Get('facturas')
  getFacturas(): FacturaMockDto[] {
    return this.facturacionService.findAllFacturas();
  }

  // Endpoint: GET /mock-facturacion/facturas/:id
  @Get('facturas/:id')
  getFacturaById(@Param('id') id: string): FacturaMockDto {
    return this.facturacionService.findOneFactura(id);
  }

  // Endpoint: GET /mock-facturacion/clientes/:clienteId/pendientes
  @Get('clientes/:clienteId/pendientes')
  getPendientesByCliente(@Param('clienteId') clienteId: string): FacturaMockDto[] {
    return this.facturacionService.findFacturasPendientesByCliente(clienteId);
  }
}