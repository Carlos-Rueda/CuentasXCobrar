import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CuentaBancariaEntity } from './cuenta-bancaria.entity';
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto';
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class CuentasBancariasService implements OnModuleInit {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  /**
   * Seed de datos iniciales en Supabase si la tabla está vacía.
   */
  async onModuleInit() {
    try {
      const count = await this.prismaService.cuentas_bancarias.count();
      if (count === 0) {
        await this.prismaService.cuentas_bancarias.createMany({
          data: [],
        });
      }
    } catch (error) {
      console.error('Error al sembrar datos de cuentas bancarias:', error);
    }
  }

  /**
   * Mapea un registro de base de datos cuentas_bancarias (snake_case) al formato del frontend CuentaBancariaEntity (camelCase).
   */
  private mapToEntity(db: any): CuentaBancariaEntity {
    return {
      id: db.id,
      codigo: db.codigo,
      nombreCuenta: db.nombre_cuenta,
      entidadBancaria: db.entidad_bancaria,
      titular: db.titular || '',
      tipoCuenta: db.tipo_cuenta || '',
      nroCuenta: db.nro_cuenta || '',
      ruc: db.ruc || '',
      descripcion: db.descripcion || undefined,
      estado: (db.estado || 'ACTIVO').toUpperCase(),
    };
  }

  /**
   * Mapea un registro de base de datos a un formato simplificado de lista sin descripcion ni estado.
   */
  private mapToListItem(db: any) {
    return {
      id: db.id,
      codigo: db.codigo,
      nombreCuenta: db.nombre_cuenta,
      entidadBancaria: db.entidad_bancaria,
      titular: db.titular || '',
      tipoCuenta: db.tipo_cuenta || '',
      nroCuenta: db.nro_cuenta || '',
      ruc: db.ruc || '',
    };
  }

  async findAll(allMode?: string): Promise<any[]> {
    if (allMode === 'true') {
      const list = await this.prismaService.cuentas_bancarias.findMany({
        orderBy: { created_at: 'asc' },
      });
      return list.map((item) => this.mapToEntity(item));
    } else if (allMode === 'all') {
      const list = await this.prismaService.cuentas_bancarias.findMany({
        orderBy: { created_at: 'asc' },
      });
      return list.map((item) => this.mapToListItem(item));
    } else {
      const list = await this.prismaService.cuentas_bancarias.findMany({
        where: {
          estado: {
            equals: 'ACTIVO',
            mode: 'insensitive',
          },
        },
        orderBy: { created_at: 'asc' },
      });
      return list.map((item) => this.mapToListItem(item));
    }
  }

  /**
   * Busca una cuenta bancaria por su ID en la base de datos real.
   */
  async findOne(id: string): Promise<CuentaBancariaEntity | null> {
    const item = await this.prismaService.cuentas_bancarias.findUnique({
      where: { id },
    });
    if (!item) return null;
    return this.mapToEntity(item);
  }

  /**
   * Genera el siguiente código secuencial de cuenta bancaria (e.g., CTA-BAN-004).
   */
  private async generarSiguienteCodigo(): Promise<string> {
    const list = await this.prismaService.cuentas_bancarias.findMany({
      select: { codigo: true },
    });

    let maxNum = 0;
    const prefix = 'CTA-BAN-';

    for (const item of list) {
      if (item.codigo && item.codigo.startsWith(prefix)) {
        const numStr = item.codigo.substring(prefix.length);
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextNum = maxNum + 1;
    const paddedNum = String(nextNum).padStart(3, '0');
    return `${prefix}${paddedNum}`;
  }

  /**
   * Crea una nueva cuenta bancaria en la base de datos real.
   */
  async create(
    cuenta: CreateCuentaBancariaDto,
    token: string,
    ip: string,
  ): Promise<CuentaBancariaEntity | null> {
    const codigo = cuenta.codigo || (await this.generarSiguienteCodigo());
    const dbCuenta = await this.prismaService.cuentas_bancarias.create({
      data: {
        codigo: codigo,
        nombre_cuenta: cuenta.nombreCuenta,
        entidad_bancaria: cuenta.entidadBancaria,
        titular: cuenta.titular,
        tipo_cuenta: cuenta.tipoCuenta,
        nro_cuenta: cuenta.nroCuenta,
        ruc: cuenta.ruc,
        descripcion: cuenta.descripcion || null,
        estado: cuenta.estado || 'ACTIVO',
      },
    });
    // Registrar auditoría
    await this.auditoriaService.registrar({
      token: token,
      idFuncion: 9,
      accion: 'CREAR',
      descripcion: 'Creación de cuenta bancaria',
      observacion: `Cuenta ${dbCuenta.codigo} creada correctamente`,
      ip: ip,
    });
    return this.mapToEntity(dbCuenta);
  }

  /**
   * Actualiza una cuenta bancaria existente en la base de datos real.
   */
  async update(
    id: string,
    cuentaActualizada: UpdateCuentaBancariaDto,
    token: string,
    ip: string,
  ): Promise<CuentaBancariaEntity | null> {
    const data: any = {};

    if (cuentaActualizada.codigo !== undefined) {
      data.codigo = cuentaActualizada.codigo;
    }
    if (cuentaActualizada.nombreCuenta !== undefined) {
      data.nombre_cuenta = cuentaActualizada.nombreCuenta;
    }
    if (cuentaActualizada.entidadBancaria !== undefined) {
      data.entidad_bancaria = cuentaActualizada.entidadBancaria;
    }
    if (cuentaActualizada.titular !== undefined) {
      data.titular = cuentaActualizada.titular;
    }
    if (cuentaActualizada.tipoCuenta !== undefined) {
      data.tipo_cuenta = cuentaActualizada.tipoCuenta;
    }
    if (cuentaActualizada.nroCuenta !== undefined) {
      data.nro_cuenta = cuentaActualizada.nroCuenta;
    }
    if (cuentaActualizada.ruc !== undefined) {
      data.ruc = cuentaActualizada.ruc;
    }
    if (cuentaActualizada.descripcion !== undefined) {
      data.descripcion = cuentaActualizada.descripcion || null;
    }
    if (cuentaActualizada.estado !== undefined) {
      data.estado = cuentaActualizada.estado;
    }

    try {
      const dbCuenta = await this.prismaService.cuentas_bancarias.update({
        where: { id },
        data,
      });
      // Registrar auditoría
      await this.auditoriaService.registrar({
        token,
        idFuncion: 9,
        accion: 'EDITAR',
        descripcion: 'Edición de cuenta bancaria',
        observacion: `Cuenta ${dbCuenta.codigo} editada correctamente`,
        ip,
      });
      return this.mapToEntity(dbCuenta);
    } catch {
      return null;
    }
  }

  /**
   * Elimina una cuenta bancaria.
   */
  async remove(id: string, token: string, ip: string): Promise<void> {
    const exists = await this.prismaService.cuentas_bancarias.findUnique({
      where: { id },
    });
    if (!exists) {
      throw new NotFoundException(`Cuenta bancaria con ID ${id} no encontrada`);
    }

    // Registrar auditoría al inactivar
    await this.auditoriaService.registrar({
      token,
      idFuncion: 9,
      accion: 'INACTIVAR',
      descripcion: 'Inactivación de cuenta bancaria',
      observacion: `Cuenta ${exists.codigo} inactivada correctamente`,
      ip,
    });

    await this.prismaService.cuentas_bancarias.update({
      where: { id },
      data: { estado: 'inactivo' },
    });
  }

  /**
   * Calcula el saldo disponible de una cuenta bancaria de forma dinámica a partir de sus movimientos.
   */
  async calcularSaldo(
    cuentaId: string,
  ): Promise<{ cuenta_id: string; saldo_disponible: number }> {
    const cuenta = await this.prismaService.cuentas_bancarias.findUnique({
      where: { id: cuentaId },
    });

    if (!cuenta) {
      throw new NotFoundException(
        `Cuenta bancaria con ID ${cuentaId} no encontrada`,
      );
    }

    // 1. Sumar recaudación por pagos de clientes (Ingresos de CXC)
    const pagos = await this.prismaService.pagos_clientes.findMany({
      where: {
        cuenta_bancaria_id: cuentaId,
        estado: {
          equals: 'activo',
          mode: 'insensitive',
        },
      },
      include: {
        detalles_pago: true,
      },
    });

    let ingresos_pagos = 0;
    for (const p of pagos) {
      const sumDetalles = p.detalles_pago.reduce(
        (sum, d) => sum + Number(d.monto_pagado),
        0,
      );
      ingresos_pagos += sumDetalles;
    }

    // Sincronizar gastos de compras antes de calcular saldo
    const { sincronizarGastosCompras } = await import('../../utils/sync-compras');
    await sincronizarGastosCompras(this.prismaService);

    // 2. Calcular otros movimientos
    const movimientos = await this.prismaService.movimientos.findMany({
      where: {
        OR: [{ cuenta_origen_id: cuentaId }, { cuenta_destino_id: cuentaId }],
      },
    });

    let saldo_movimientos = 0;
    let total_compras = 0;
    for (const mov of movimientos) {
      const monto = Number(mov.monto);
      if (mov.tipo === 'ingreso') {
        if (mov.cuenta_destino_id === cuentaId) {
          saldo_movimientos += monto;
        }
      } else if (mov.tipo === 'egreso') {
        if (mov.cuenta_origen_id === cuentaId) {
          if (mov.descripcion.startsWith('Gasto Compras:')) {
            total_compras += monto;
          } else {
            saldo_movimientos -= monto;
          }
        }
      } else if (mov.tipo === 'transferencia') {
        if (mov.cuenta_destino_id === cuentaId) {
          saldo_movimientos += monto;
        }
        if (mov.cuenta_origen_id === cuentaId) {
          saldo_movimientos -= monto;
        }
      }
    }

    // 4. Obtener saldo de facturación (desde API externa GraphQL)
    let saldo_facturacion = 0;
    try {
      const apiKey =
        process.env.FACTURACION_API_KEY || 'api_key_facturacion_cxc_2026';
      const graphqlUrl =
        process.env.FACTURACION_GRAPHQL_URL ||
        'https://ad-modulo-facturacion-e51e.onrender.com/graphql';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['x-api-key'] = apiKey;
      } else {
        let token = '';
        const tokenRes = await fetch(
          'https://ad-modulo-facturacion-e51e.onrender.com/auth/test-token',
        );
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          token = tokenData?.token || '';
        }
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }

      const gqlQuery = {
        query: `
          query SaldoCuenta($cuentaId: ID!) {
            saldoCuenta(cuentaId: $cuentaId) {
              saldoActual
            }
          }
        `,
        variables: { cuentaId },
      };

      const gqlRes = await fetch(graphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(gqlQuery),
      });

      if (gqlRes.ok) {
        const gqlBody = await gqlRes.json();
        saldo_facturacion = gqlBody?.data?.saldoCuenta?.saldoActual || 0;
      }
    } catch (e) {
      console.error('Error al obtener saldo facturacion en calcularSaldo:', e);
    }

    const saldo_cxc = ingresos_pagos + saldo_movimientos - total_compras;
    const saldo_total = saldo_cxc + saldo_facturacion;

    return {
      cuenta_id: cuentaId,
      saldo_disponible: Number(saldo_total.toFixed(2)),
    };
  }
}
