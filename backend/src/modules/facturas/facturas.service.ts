import { Injectable, NotFoundException } from '@nestjs/common';
import { ClienteDto } from './dto/cliente.dto';
import { FacturaDto, DetalleFacturaDto } from './dto/factura.dto';
import * as PDFDocument from 'pdfkit';
import 'dotenv/config';

@Injectable()
export class FacturasService {
  private readonly graphqlUrl =
    'https://ad-modulo-facturacion.onrender.com/graphql';

  private cachedToken: string = '';

  private async getFreshToken(): Promise<string> {
    try {
      const response = await fetch('https://ad-modulo-facturacion.onrender.com/auth/test-token');
      if (response.ok) {
        const data = await response.json();
        if (data && data.token) {
          this.cachedToken = data.token;
          return data.token;
        }
      }
    } catch (error) {
      console.error('Error fetching fresh token from test-token endpoint in FacturasService:', error);
    }
    return '';
  }

  /**
   * Helper privado para realizar peticiones POST a la API GraphQL.
   */
  private async queryGraphQL(query: string, variables: any = {}) {
    let token = this.cachedToken || process.env.FACTURACION_JWT_TOKEN || process.env.FACTURACION_API_TOKEN || '';

    if (!token) {
      token = await this.getFreshToken();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      let response = await fetch(this.graphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok && response.status !== 401) {
        throw new Error(`HTTP status ${response.status}`);
      }

      let body = await response.json();

      // Si no autorizado, renovar token e intentar de nuevo
      const isUnauthorized = response.status === 401 || body.errors?.some(
        (e: any) => e.message?.toLowerCase().includes('no autorizado') || e.code === 'UNAUTHENTICATED'
      );

      if (isUnauthorized) {
        console.log('Token de facturación no autorizado o expirado en FacturasService. Obteniendo nuevo token...');
        token = await this.getFreshToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          response = await fetch(this.graphqlUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query, variables }),
          });
          if (!response.ok) {
            throw new Error(`HTTP status ${response.status}`);
          }
          body = await response.json();
        }
      }

      if (body.errors && body.errors.length > 0) {
        throw new Error(body.errors[0].message || 'GraphQL Error');
      }

      return body.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Hubo un problema de comunicación con el Módulo de Facturación: ${message}`);
    }
  }

  /**
   * Mapea el formato de cliente devuelto por GraphQL al ClienteDto esperado por el sistema.
   */
  private mapCliente(gqlCliente: any): ClienteDto {
    return {
      id: gqlCliente.id,
      nombre: gqlCliente.nombre,
      ruc: gqlCliente.cedula, // Mapeo: 'cedula' -> 'ruc'
      correo: gqlCliente.email, // Mapeo: 'email' -> 'correo'
      telefono: gqlCliente.telefono,
    };
  }

  /**
   * Mapea el formato de factura devuelto por GraphQL al FacturaDto esperado por el sistema.
   */
  private mapFactura(gqlFactura: any): FacturaDto {
    const detalles: DetalleFacturaDto[] = (gqlFactura.detalles || []).map(
      (d: any) => ({
        producto: d.productoNombre || d.productoCodigo || 'Producto Sin Nombre',
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario || 0,
      }),
    );

    return {
      id: gqlFactura.id,
      numero: gqlFactura.numeroFactura, // Mapeo: 'numeroFactura' -> 'numero'
      clienteId: gqlFactura.clienteId,
      fechaEmision: gqlFactura.fechaEmision
        ? gqlFactura.fechaEmision.split('T')[0]
        : '',
      total: gqlFactura.total,
      estado: gqlFactura.estado,
      detalles,
    };
  }

  /**
   * Obtiene todos los clientes de facturación.
   */
  async findAllClientes(): Promise<ClienteDto[]> {
    const query = `
      query {
        clientes(limit: 1000) {
          items {
            id
            cedula
            nombre
            email
            telefono
          }
        }
      }
    `;
    const data = await this.queryGraphQL(query);
    const items = data.clientes?.items || [];
    const mapped = items.map((c: any) => this.mapCliente(c));
    const map = new Map<string, ClienteDto>();
    for (const c of mapped) {
      const key = (c as any).cedula || (c as any).ruc || c.nombre;
      if (!map.has(key)) {
        map.set(key, c);
      }
    }
    return Array.from(map.values());
  }

  /**
   * Busca un cliente por su ID.
   */
  async findOneCliente(id: string): Promise<ClienteDto> {
    const query = `
      query($id: ID!) {
        cliente(id: $id) {
          id
          cedula
          nombre
          email
          telefono
        }
      }
    `;
    const data = await this.queryGraphQL(query, { id });
    if (!data.cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }
    return this.mapCliente(data.cliente);
  }

  /**
   * Obtiene todas las facturas registradas.
   */
  async findAllFacturas(): Promise<FacturaDto[]> {
    const query = `
      query {
        facturas(limit: 1000) {
          items {
            id
            numeroFactura
            clienteId
            fechaEmision
            total
            estado
          }
        }
      }
    `;
    const data = await this.queryGraphQL(query);
    const mapped = (data.facturas?.items || []).map((f: any) => this.mapFactura(f));
    return mapped.filter((f: FacturaDto) => f.estado && (f.estado.toUpperCase() === 'EMITIDA' || f.estado.toUpperCase() === 'PAGO_PENDIENTE'));
  }

  /**
   * Busca una factura por su ID.
   */
  async findOneFactura(id: string): Promise<FacturaDto> {
    const query = `
      query($id: ID!) {
        factura(id: $id) {
          id
          numeroFactura
          clienteId
          fechaEmision
          total
          estado
          detalles {
            id
            productoCodigo
            productoNombre
            cantidad
            precioUnitario
          }
        }
      }
    `;
    const data = await this.queryGraphQL(query, { id });
    if (!data.factura) {
      throw new NotFoundException(`Factura con ID ${id} no encontrada`);
    }
    const factura = this.mapFactura(data.factura);
    if (!factura.estado || (factura.estado.toUpperCase() !== 'EMITIDA' && factura.estado.toUpperCase() !== 'PAGO_PENDIENTE')) {
      throw new NotFoundException(`Factura con ID ${id} no está en un estado emitido/válido`);
    }
    return factura;
  }

  /**
   * Obtiene facturas pendientes de un cliente.
   */
  async findFacturasPendientesByCliente(
    clienteId: string,
  ): Promise<FacturaDto[]> {
    // Para mayor robustez, consultamos las facturas filtradas
    const query = `
      query($clienteId: String!) {
        facturas(filter: { clienteId: $clienteId }) {
          items {
            id
            numeroFactura
            clienteId
            fechaEmision
            total
            estado
          }
        }
      }
    `;
    try {
      const data = await this.queryGraphQL(query, { clienteId });
      const facturas = (data.facturas?.items || []).map((f: any) =>
        this.mapFactura(f),
      );
      return facturas.filter((f: FacturaDto) => f.estado === 'PENDIENTE' || f.estado === 'PAGO_PENDIENTE');
    } catch {
      // Fallback: Filtrado en memoria en caso de que la API de filter falle o varíe
      const todas = await this.findAllFacturas();
      return todas.filter(
        (f) => f.clienteId === clienteId && (f.estado === 'PENDIENTE' || f.estado === 'PAGO_PENDIENTE'),
      );
    }
  }

  /**
   * Crea una nueva factura.
   */
  async crearFactura(dto: any): Promise<FacturaDto> {
    const mutation = `
      mutation($input: CrearFacturaInput!) {
        crearFactura(input: $input) {
          id
          numeroFactura
          clienteId
          tipoPago
          fechaEmision
          total
          estado
        }
      }
    `;

    const input = {
      clienteId: dto.clienteId,
      tipoPago: dto.tipoPago || 'EFECTIVO',
      detalles: (dto.detalles || []).map((d: any) => ({
        productoCodigo: d.productoCodigo || d.producto || '',
        cantidad: Number(d.cantidad),
      })),
    };

    const data = await this.queryGraphQL(mutation, { input });
    return this.mapFactura(data.crearFactura);
  }

  /**
   * Genera el PDF del comprobante de la factura.
   */
  async generarFacturaPdf(id: string): Promise<Buffer> {
    const factura = await this.findOneFactura(id);
    const cliente = await this.findOneCliente(factura.clienteId);

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
