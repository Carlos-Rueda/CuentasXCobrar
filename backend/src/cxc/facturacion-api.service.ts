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
    }>;
  };
}

@Injectable()
export class FacturacionApiService {
  private readonly graphqlUrl =
    'https://ad-modulo-facturacion.onrender.com/graphql';

  /**
   * Helper privado para realizar peticiones POST HTTP a la API de GraphQL externa.
   */
  private async queryGraphQL<T>(
    query: string,
    variables: Record<string, unknown> = {},
  ): Promise<T> {
    const token =
      process.env.FACTURACION_JWT_TOKEN ||
      process.env.FACTURACION_API_TOKEN ||
      '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(this.graphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }

      const body = (await response.json()) as {
        data?: T;
        errors?: Array<{ message: string }>;
      };

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
        clientes {
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

    return items.map((c) => ({
      id: c.id,
      cedula: c.cedula,
      nombre: c.nombre,
      tipoCliente: c.tipoCliente,
      direccion: c.direccion,
      telefono: c.telefono,
      correo: c.email, // Mapeo de email a correo
    }));
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
          facturas {
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

    // Filtrar facturas con estado PENDIENTE / por cobrar
    return items
      .filter((f) => f.estado && f.estado.toUpperCase() === 'PENDIENTE')
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
        facturas {
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
    const data = await this.queryGraphQL<FacturasResponse>(query);
    return (data.facturas?.items || []).map((f) => ({
      id: f.id,
      numeroFactura: f.numeroFactura,
      clienteId: f.clienteId,
      total: f.total,
      estado: f.estado,
    }));
  }
}
