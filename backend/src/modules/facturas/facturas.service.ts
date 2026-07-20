import { Injectable, NotFoundException } from '@nestjs/common';
import { ClienteDto } from './dto/cliente.dto';
import { FacturaDto, DetalleFacturaDto } from './dto/factura.dto';
import * as PDFDocument from 'pdfkit';
import { PdfHelper } from '../pdf-helper';
import 'dotenv/config';

@Injectable()
export class FacturasService {
  private readonly graphqlUrl =
    process.env.FACTURACION_GRAPHQL_URL ||
    'https://isfi18adb8.execute-api.us-east-1.amazonaws.com/graphql';

  private cachedToken: string = '';

  private async getFreshToken(): Promise<string> {
    if (this.cachedToken) {
      return this.cachedToken;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(
        'https://isfi18adb8.execute-api.us-east-1.amazonaws.com/auth/test-token',
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        if (data && data.token) {
          this.cachedToken = data.token;
          return data.token;
        }
      }
    } catch (error) {
      console.error(
        'Error fetching fresh token from test-token endpoint in FacturasService:',
        error,
      );
    }
    return '';
  }

  /**
   * Helper privado para realizar peticiones POST a la API GraphQL.
   */
  private async queryGraphQL(query: string, variables: any = {}) {
    const apiKey = process.env.FACTURACION_API_KEY || 'api_key_facturacion_cxc_2026';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['x-api-key'] = apiKey;
    } else {
      let token =
        this.cachedToken ||
        process.env.FACTURACION_JWT_TOKEN ||
        process.env.FACTURACION_API_TOKEN ||
        '';

      if (!token) {
        token = await this.getFreshToken();
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
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

      // Si no autorizado, renovar token e intentar de nuevo (solo si no se usó apiKey)
      const isUnauthorized =
        !apiKey &&
        (response.status === 401 ||
          body.errors?.some(
            (e: any) =>
              e.message?.toLowerCase().includes('no autorizado') ||
              e.code === 'UNAUTHENTICATED',
          ));

      if (isUnauthorized) {
        this.cachedToken = '';
        const token = await this.getFreshToken();
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
      throw new Error(
        `Hubo un problema de comunicación con el Módulo de Facturación: ${message}`,
      );
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
      const key = c.cedula || c.ruc || c.nombre;
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
    const mapped = (data.facturas?.items || []).map((f: any) =>
      this.mapFactura(f),
    );
    return mapped.filter(
      (f: FacturaDto) =>
        f.estado &&
        (f.estado.toUpperCase() === 'EMITIDA' ||
          f.estado.toUpperCase() === 'PAGO_PENDIENTE'),
    );
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
    if (
      !factura.estado ||
      (factura.estado.toUpperCase() !== 'EMITIDA' &&
        factura.estado.toUpperCase() !== 'PAGO_PENDIENTE')
    ) {
      throw new NotFoundException(
        `Factura con ID ${id} no está en un estado emitido/válido`,
      );
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
      return facturas.filter(
        (f: FacturaDto) =>
          f.estado === 'PENDIENTE' || f.estado === 'PAGO_PENDIENTE',
      );
    } catch {
      // Fallback: Filtrado en memoria en caso de que la API de filter falle o varíe
      const todas = await this.findAllFacturas();
      return todas.filter(
        (f) =>
          f.clienteId === clienteId &&
          (f.estado === 'PENDIENTE' || f.estado === 'PAGO_PENDIENTE'),
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
        const doc = PdfHelper.createDocument();
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: any) => reject(err));

        // Cabecera estándar
        PdfHelper.drawHeader(doc, 'Comprobante de Factura');

        // Metadatos
        const leftItems = [
          { label: 'N° Factura', value: factura.numero || id },
          { label: 'Fecha Emisión', value: factura.fechaEmision || 'N/A' },
          { label: 'Estado', value: factura.estado || 'N/A' },
        ];
        const rightItems = [
          { label: 'Cliente', value: cliente.nombre || 'N/A' },
          { label: 'RUC/Cédula', value: cliente.ruc || 'N/A' },
          { label: 'Correo', value: cliente.correo || 'N/A' },
          { label: 'Teléfono', value: cliente.telefono || 'N/A' },
        ];
        PdfHelper.drawMetadata(doc, leftItems, rightItems);

        // Sección Detalles
        doc.font('Helvetica-Bold').fontSize(11).fillColor(PdfHelper.TEXT_DARK).text('DETALLES DE LA FACTURA');
        doc.moveDown(0.5);

        // Tabla de ítems
        const columns = [
          { label: 'Producto/Servicio', width: 220 },
          { label: 'Cant.', width: 60, align: 'right' },
          { label: 'P. Unitario', width: 90, align: 'right' },
          { label: 'Total', width: 102, align: 'right' },
        ];
        PdfHelper.drawTableHeader(doc, columns);

        if (factura.detalles && factura.detalles.length > 0) {
          factura.detalles.forEach((det, idx) => {
            const totalItem = Number(det.cantidad) * Number(det.precioUnitario);
            PdfHelper.drawTableRow(
              doc,
              [
                det.producto || 'N/A',
                String(det.cantidad),
                `$${det.precioUnitario.toFixed(2)}`,
                `$${totalItem.toFixed(2)}`,
              ],
              columns,
              idx % 2 === 1,
            );
          });
        } else {
          PdfHelper.drawTableRow(
            doc,
            ['Sin detalles de ítems.', '', '', ''],
            columns,
            false,
          );
        }
        
        doc.moveDown(1);
        
        // Totalizador
        const totalY = doc.y;
        doc.rect(350, totalY, 212, 22).fill(PdfHelper.BG_LIGHT);
        doc.fillColor(PdfHelper.TEXT_DARK).font('Helvetica-Bold').fontSize(10);
        doc.text('TOTAL FACTURADO:', 360, totalY + 6);
        doc.fillColor(PdfHelper.UTN_RED).font('Helvetica-Bold').fontSize(10);
        doc.text(`$${factura.total.toFixed(2)}`, 450, totalY + 6, { align: 'right', width: 100 });

        PdfHelper.finalize(doc);
      } catch (error) {
        reject(error);
      }
    });
  }
}
