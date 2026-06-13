import { Injectable, NotFoundException } from '@nestjs/common';
import { ClienteMockDto } from './dto/cliente-mock.dto';
import { FacturaMockDto } from './dto/factura-mock.dto';

@Injectable()
export class FacturacionMockService {
  // Datos simulados de clientes fuertemente tipados
  private readonly clientes: ClienteMockDto[] = [
    { id: 'cli-001', nombre: 'Carlos Rueda', ruc: '1004123456001', correo: 'carlos@mail.com', telefono: '0999999999' },
    { id: 'cli-002', nombre: 'Distribuidora Norte', ruc: '1792123456001', correo: 'contacto@distnorte.com', telefono: '022345678' },
    { id: 'cli-003', nombre: 'María Andrade', ruc: '0401234567', correo: 'maria.andrade@mail.com', telefono: '0987654321' }
  ];

  // Datos simulados de facturas vinculadas a los clientes
  private readonly facturas: FacturaMockDto[] = [
    { 
      id: 'fac-101', 
      numero: '001-001-000000123', 
      clienteId: 'cli-001', 
      fechaEmision: '2026-06-01', 
      total: 150.00, 
      estado: 'PENDIENTE', 
      detalles: [{ producto: 'Licencia Software de Desarrollo', cantidad: 1, precioUnitario: 150.00 }]
    },
    { 
      id: 'fac-102', 
      numero: '001-001-000000124', 
      clienteId: 'cli-002', 
      fechaEmision: '2026-06-05', 
      total: 1250.50, 
      estado: 'PENDIENTE',
      detalles: [{ producto: 'Servidor Cloud VPS Básica', cantidad: 5, precioUnitario: 250.10 }]
    },
    { 
      id: 'fac-103', 
      numero: '001-001-000000125', 
      clienteId: 'cli-001', 
      fechaEmision: '2026-06-10', 
      total: 45.00, 
      estado: 'PAGADA',
      detalles: [{ producto: 'Mantenimiento Técnico', cantidad: 1, precioUnitario: 45.00 }]
    }
  ];

  // Métodos globales de Clientes
  findAllClientes(): ClienteMockDto[] {
    return this.clientes;
  }

  findOneCliente(id: string): ClienteMockDto {
    const cliente = this.clientes.find(c => c.id === id);
    if (!cliente) throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    return cliente;
  }

  // Métodos globales de Facturas
  findAllFacturas(): FacturaMockDto[] {
    return this.facturas;
  }

  findOneFactura(id: string): FacturaMockDto {
    const factura = this.facturas.find(f => f.id === id);
    if (!factura) throw new NotFoundException(`Factura con ID ${id} no encontrada`);
    return factura;
  }

  // Método específico indispensable para Cuentas por Cobrar (CXC)
  findFacturasPendientesByCliente(clienteId: string): FacturaMockDto[] {
    return this.facturas.filter(f => f.clienteId === clienteId && f.estado === 'PENDIENTE');
  }
}