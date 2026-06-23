import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CuentaBancariaEntity } from './cuenta-bancaria.entity';
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto';
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto';

@Injectable()
export class CuentasBancariasService implements OnModuleInit {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Seed de datos iniciales en Supabase si la tabla está vacía.
   */
  async onModuleInit() {
    try {
      const count = await this.prismaService.cuentas_bancarias.count();
      if (count === 0) {
        await this.prismaService.cuentas_bancarias.createMany({
          data: [
            {
              codigo: 'CTA-BAN-001',
              nombre_cuenta: 'Cuenta Corriente Principal',
              entidad_bancaria: 'Banco Pichincha',
              descripcion:
                'Cuenta corriente principal para recibir transferencias interbancarias y depósitos de clientes.',
              estado: 'activo',
            },
            {
              codigo: 'CTA-BAN-002',
              nombre_cuenta: 'Cuenta de Ahorros Recaudación',
              entidad_bancaria: 'Banco Guayaquil',
              descripcion:
                'Cuenta de ahorros destinada a la recaudación de pagos con cheques y depósitos directos.',
              estado: 'activo',
            },
            {
              codigo: 'CTA-BAN-003',
              nombre_cuenta: 'Cuenta Especial Corriente',
              entidad_bancaria: 'Produbanco',
              descripcion:
                'Cuenta de uso exclusivo para cobros corporativos de clientes VIP y transferencias internacionales.',
              estado: 'activo',
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error al sembrar datos de cuentas bancarias:', error);
    }
  }

  /**
   * Mapea un registro de base de datos cuentas_bancarias (snake_case) al formato del frontend CuentaBancariaEntity (camelCase).
   */
  private mapToEntity(db: {
    id: string;
    codigo: string;
    nombre_cuenta: string;
    entidad_bancaria: string;
    descripcion: string | null;
    estado: string | null;
  }): CuentaBancariaEntity {
    return {
      id: db.id,
      codigo: db.codigo,
      nombreCuenta: db.nombre_cuenta,
      entidadBancaria: db.entidad_bancaria,
      descripcion: db.descripcion || undefined,
      estado: db.estado || 'activo',
    };
  }

  /**
   * Obtiene todas las cuentas bancarias de la base de datos real.
   */
  async findAll(): Promise<CuentaBancariaEntity[]> {
    const list = await this.prismaService.cuentas_bancarias.findMany({
      orderBy: { created_at: 'asc' },
    });
    return list.map((item) => this.mapToEntity(item));
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
   * Crea una nueva cuenta bancaria en la base de datos real.
   */
  async create(
    cuenta: CreateCuentaBancariaDto,
  ): Promise<CuentaBancariaEntity | null> {
    const dbCuenta = await this.prismaService.cuentas_bancarias.create({
      data: {
        codigo: cuenta.codigo,
        nombre_cuenta: cuenta.nombreCuenta,
        entidad_bancaria: cuenta.entidadBancaria,
        descripcion: cuenta.descripcion || null,
        estado: cuenta.estado || 'activo',
      },
    });
    return this.mapToEntity(dbCuenta);
  }

  /**
   * Actualiza una cuenta bancaria existente en la base de datos real.
   */
  async update(
    id: string,
    cuentaActualizada: UpdateCuentaBancariaDto,
  ): Promise<CuentaBancariaEntity | null> {
    const data: {
      codigo?: string;
      nombre_cuenta?: string;
      entidad_bancaria?: string;
      descripcion?: string | null;
      estado?: string;
    } = {};

    if (cuentaActualizada.codigo !== undefined) {
      data.codigo = cuentaActualizada.codigo;
    }
    if (cuentaActualizada.nombreCuenta !== undefined) {
      data.nombre_cuenta = cuentaActualizada.nombreCuenta;
    }
    if (cuentaActualizada.entidadBancaria !== undefined) {
      data.entidad_bancaria = cuentaActualizada.entidadBancaria;
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
      return this.mapToEntity(dbCuenta);
    } catch {
      return null;
    }
  }

  /**
   * Elimina una cuenta bancaria.
   */
  async remove(id: string): Promise<void> {
    const exists = await this.prismaService.cuentas_bancarias.findUnique({
      where: { id },
    });
    if (!exists) {
      throw new NotFoundException(`Cuenta bancaria con ID ${id} no encontrada`);
    }

    await this.prismaService.cuentas_bancarias.delete({
      where: { id },
    });
  }
}
