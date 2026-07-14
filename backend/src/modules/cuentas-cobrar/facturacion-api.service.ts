import { Injectable, InternalServerErrorException } from '@nestjs/common';
import 'dotenv/config';

export interface ClienteDto {
  id: string;
  cedula: string;
  nombre: string;
  tipoCliente: string;
  direccion: string;
  telefono: string;
  correo: string;
}

export interface FacturaDto {
  id: string;
  numeroFactura: string;
  clienteId: string;
  total: number;
  saldo?: number;
  estado: string;
  tipoPago?: string;
}

interface ClientesResponse {
  clientes: {
    items: Array<{
      id: string;
      cedula: string;
      nombre: string;
      tipoCliente: string;
      direccion: string;
      telefono: string;
      email: string;
    }>;
  };
}

interface ClienteResponse {
  cliente: {
    id: string;
    cedula: string;
    nombre: string;
    tipoCliente: string;
    direccion: string;
    telefono: string;
    email: string;
  } | null;
}

interface FacturasResponse {
  facturas: {
    items: Array<{
      id: string;
      numeroFactura: string;
      clienteId: string;
      total: number;
      estado: string;
      tipoPago?: string;
    }>;
  };
}

@Injectable()
export class FacturacionApiService {
  private readonly graphqlUrl =
    'https://ad-modulo-facturacion-e51e.onrender.com/graphql';

  /**
   * Helper privado para realizar peticiones POST HTTP a la API de GraphQL externa.
   */
  private cachedToken: string = '';

  private async getFreshToken(): Promise<string> {
    try {
      const response = await fetch(
        'https://ad-modulo-facturacion-e51e.onrender.com/auth/test-token',
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.token) {
          this.cachedToken = data.token;
          return data.token;
        }
      }
    } catch (error) {
      console.error(
        'Error fetching fresh token from test-token endpoint:',
        error,
      );
    }
    return '';
  }

  /**
   * Helper privado para realizar peticiones POST HTTP a la API de GraphQL externa.
   */
  private async queryGraphQL<T>(
    query: string,
    variables: Record<string, unknown> = {},
  ): Promise<T> {
    let token =
      this.cachedToken ||
      process.env.FACTURACION_JWT_TOKEN ||
      process.env.FACTURACION_API_TOKEN ||
      '';

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

      let body = (await response.json()) as {
        data?: T;
        errors?: Array<{ message: string; code?: string }>;
      };

      // Si no autorizado, renovar token e intentar de nuevo
      const isUnauthorized =
        response.status === 401 ||
        body.errors?.some(
          (e) =>
            e.message?.toLowerCase().includes('no autorizado') ||
            e.code === 'UNAUTHENTICATED',
        );

      if (isUnauthorized) {
        console.log(
          'Token de facturación no autorizado o expirado. Obteniendo nuevo token...',
        );
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
          body = (await response.json()) as {
            data?: T;
            errors?: Array<{ message: string }>;
          };
        }
      }

      if (body.errors && body.errors.length > 0) {
        throw new Error(body.errors[0]?.message || 'GraphQL Error');
      }

      if (!body.data) {
        throw new Error('No data returned');
      }

      return body.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Hubo un problema de comunicación con el Módulo de Facturación: ${message}`,
      );
    }
  }

  /**
   * Obtiene todos los clientes de facturación desde la API GraphQL.
   */
  async obtenerClientes(): Promise<ClienteDto[]> {
    const query = `
      query {
        clientes(limit: 1000) {
          items {
            id
            cedula
            nombre
            tipoCliente
            direccion
            telefono
            email
          }
        }
      }
    `;

    const data = await this.queryGraphQL<ClientesResponse>(query);
    const items = data.clientes?.items || [];

    const mapped = items.map((c) => ({
      id: c.id,
      cedula: c.cedula,
      nombre: c.nombre,
      tipoCliente: c.tipoCliente,
      direccion: c.direccion,
      telefono: c.telefono,
      correo: c.email, // Mapeo de email a correo
    }));

    const map = new Map<string, ClienteDto>();
    for (const c of mapped) {
      const key = c.cedula || c.nombre;
      if (!map.has(key)) {
        map.set(key, c);
      }
    }
    return Array.from(map.values());
  }

  /**
   * Obtiene un cliente específico por su ID.
   */
  async obtenerClientePorId(id: string): Promise<ClienteDto | null> {
    const query = `
      query($id: ID!) {
        cliente(id: $id) {
          id
          cedula
          nombre
          tipoCliente
          direccion
          telefono
          email
        }
      }
    `;

    const data = await this.queryGraphQL<ClienteResponse>(query, { id });
    const c = data.cliente;
    if (!c) return null;

    return {
      id: c.id,
      cedula: c.cedula,
      nombre: c.nombre,
      tipoCliente: c.tipoCliente,
      direccion: c.direccion,
      telefono: c.telefono,
      correo: c.email,
    };
  }

  /**
   * Obtiene las facturas pendientes/por cobrar de un cliente específico.
   */
  async obtenerFacturasPendientesPorCliente(
    clienteId: string,
  ): Promise<FacturaDto[]> {
    const query = `
      query($clienteId: String!) {
        facturas(filter: { clienteId: $clienteId }) {
          items {
            id
            numeroFactura
            clienteId
            total
            estado
          }
        }
      }
    `;

    let items: Array<{
      id: string;
      numeroFactura: string;
      clienteId: string;
      total: number;
      estado: string;
    }> = [];

    try {
      const data = await this.queryGraphQL<FacturasResponse>(query, {
        clienteId,
      });
      items = data.facturas?.items || [];
    } catch {
      // Fallback si la API externa no soporta el filtrado directo
      const queryAll = `
        query {
          facturas(limit: 1000) {
            items {
              id
              numeroFactura
              clienteId
              total
              estado
            }
          }
        }
      `;
      const dataAll = await this.queryGraphQL<FacturasResponse>(queryAll);
      items = (dataAll.facturas?.items || []).filter(
        (f) => f.clienteId === clienteId,
      );
    }

    // Filtrar facturas con estado PAGO_PENDIENTE / por cobrar
    return items
      .filter(
        (f) =>
          f.estado &&
          (f.estado.toUpperCase() === 'PENDIENTE' ||
            f.estado.toUpperCase() === 'PAGO_PENDIENTE'),
      )
      .map((f) => ({
        id: f.id,
        numeroFactura: f.numeroFactura,
        clienteId: f.clienteId,
        total: f.total,
        estado: f.estado,
      }));
  }

  /**
   * Obtiene todas las facturas de facturación desde la API GraphQL.
   */
  async obtenerFacturas(): Promise<FacturaDto[]> {
    const query = `
      query {
        facturas(limit: 1000) {
          items {
            id
            numeroFactura
            clienteId
            total
            estado
            tipoPago
          }
        }
      }
    `;
    const data = await this.queryGraphQL<FacturasResponse>(query);
    const mapped = (data.facturas?.items || []).map((f) => ({
      id: f.id,
      numeroFactura: f.numeroFactura,
      clienteId: f.clienteId,
      total: f.total,
      estado: f.estado,
      tipoPago: f.tipoPago,
    }));
    return mapped.filter(
      (f) =>
        f.estado &&
        (f.estado.toUpperCase() === 'EMITIDA' ||
          f.estado.toUpperCase() === 'PAGO_PENDIENTE'),
    );
  }

  /**
   * Obtiene una factura específica por su ID de forma individual.
   */
  async obtenerFacturaPorId(id: string): Promise<FacturaDto | null> {
    const query = `
      query($id: ID!) {
        factura(id: $id) {
          id
          numeroFactura
          clienteId
          total
          estado
        }
      }
    `;
    try {
      const data = await this.queryGraphQL<any>(query, { id });
      const f = data.factura;
      if (!f) return null;
      if (
        !f.estado ||
        (f.estado.toUpperCase() !== 'EMITIDA' &&
          f.estado.toUpperCase() !== 'PAGO_PENDIENTE')
      ) {
        return null;
      }
      return {
        id: f.id,
        numeroFactura: f.numeroFactura,
        clienteId: f.clienteId,
        total: f.total,
        estado: f.estado,
      };
    } catch (error) {
      console.error(`Error al obtener factura ${id} desde GraphQL:`, error);
      return null;
    }
  }

  async obtenerSaldoCuenta(cuentaId: string): Promise<number> {
    const query = `
      query SaldoCuenta($cuentaId: ID!) {
        saldoCuenta(cuentaId: $cuentaId) {
          saldoActual
        }
      }
    `;
    try {
      const data = await this.queryGraphQL<{ saldoCuenta: { saldoActual: number } | null }>(query, { cuentaId });
      return data?.saldoCuenta?.saldoActual || 0;
    } catch (error) {
      console.error(`Error al obtener saldo de cuenta ${cuentaId} desde GraphQL:`, error);
      return 0;
    }
  }
}
