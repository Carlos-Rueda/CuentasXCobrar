import { Injectable, NotFoundException } from '@nestjs/common';
import { ClienteMockDto } from './dto/cliente-mock.dto';
import { FacturaMockDto } from './dto/factura-mock.dto';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class FacturacionMockService {
  // Datos simulados de clientes fuertemente tipados
  private readonly clientes: ClienteMockDto[] = [
    { id: 'cli-001', nombre: 'Carlos Rueda', ruc: '1004123456001', correo: 'carlos@mail.com', telefono: '0999999999' },
    { id: 'cli-002', nombre: 'Distribuidora Norte', ruc: '1792123456001', correo: 'contacto@distnorte.com', telefono: '022345678' },
    { id: 'cli-003', nombre: 'María Andrade', ruc: '0401234567', correo: 'maria.andrade@mail.com', telefono: '0987654321' },
    { id: 'cli-004', nombre: 'Juan Pérez', ruc: '0912345678', correo: 'juan.perez@mail.com', telefono: '0987654321' },
    { id: 'cli-005', nombre: 'María López', ruc: '0923456789', correo: 'maria.lopez@mail.com', telefono: '0998877665' }
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
    },
    { 
      id: 'fac-104', 
      numero: '001-001-000000126', 
      clienteId: 'cli-004', 
      fechaEmision: '2026-06-14', 
      total: 250.00, 
      estado: 'PENDIENTE',
      detalles: [{ producto: 'Servicio de Consultoría Mensual', cantidad: 1, precioUnitario: 250.00 }]
    },
    { 
      id: 'fac-105', 
      numero: '001-001-000000127', 
      clienteId: 'cli-005', 
      fechaEmision: '2026-06-12', 
      total: 480.00, 
      estado: 'PENDIENTE',
      detalles: [{ producto: 'Suministros de Oficina', cantidad: 1, precioUnitario: 480.00 }]
    },
    { 
      id: 'fac-106', 
      numero: '001-001-000000128', 
      clienteId: 'cli-004', 
      fechaEmision: '2026-06-10', 
      total: 120.00, 
      estado: 'PAGADA',
      detalles: [{ producto: 'Soporte Remoto Mensual', cantidad: 1, precioUnitario: 120.00 }]
    },
    { 
      id: 'fac-107', 
      numero: '001-001-000000129', 
      clienteId: 'cli-002', 
      fechaEmision: '2026-06-08', 
      total: 320.00, 
      estado: 'PENDIENTE',
      detalles: [{ producto: 'Mantenimiento de Servidores', cantidad: 1, precioUnitario: 320.00 }]
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

  crearFactura(dto: any): FacturaMockDto {
    const nuevaFactura: FacturaMockDto = {
      id: dto.id || `fac-${Date.now()}`,
      numero: dto.numero,
      clienteId: dto.clienteId,
      fechaEmision: dto.fechaEmision || new Date().toISOString().split('T')[0],
      total: Number(dto.total),
      estado: dto.estado || 'PENDIENTE',
      detalles: dto.detalles || [],
    };
    this.facturas.push(nuevaFactura);
    return nuevaFactura;
  }

  generarFacturaPdf(id: string): Promise<Buffer> {
    const factura = this.findOneFactura(id);
    const cliente = this.findOneCliente(factura.clienteId);

    return new Promise((resolve, reject) => {
      try {
        const DocConstructor = (PDFDocument.default || PDFDocument) as any;
        const doc = new DocConstructor({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: any) => reject(err));

        // Diseño del PDF
        doc.fontSize(20).text('COMPROBANTE DE FACTURA', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`N° Factura: ${factura.numero}`);
        doc.text(`Fecha Emisión: ${factura.fechaEmision}`);
        doc.text(`Cliente: ${cliente.nombre}`);
        doc.text(`RUC/Cédula: ${cliente.ruc}`);
        doc.text(`Correo: ${cliente.correo}`);
        doc.text(`Teléfono: ${cliente.telefono}`);
        doc.text(`Estado: ${factura.estado}`);
        doc.text(`Total Facturado: $${factura.total.toFixed(2)}`);
        doc.moveDown();

        doc.fontSize(14).text('Detalles de la Factura', { underline: true });
        doc.moveDown(0.5);

        if (factura.detalles && factura.detalles.length > 0) {
          factura.detalles.forEach((det, idx) => {
            doc
              .fontSize(12)
              .text(
                `${idx + 1}. Producto: ${det.producto} - Cantidad: ${det.cantidad} - Precio Unitario: $${det.precioUnitario.toFixed(2)}`,
              );
          });
        } else {
          doc.fontSize(12).text('Sin detalles de ítems.');
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}