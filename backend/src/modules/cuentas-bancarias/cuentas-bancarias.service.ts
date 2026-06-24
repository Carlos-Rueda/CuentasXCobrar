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
              titular: 'Empresa Integrador S.A.',
              tipo_cuenta: 'Corriente',
              nro_cuenta: '2100987654',
              ruc: '1790011223001',
              descripcion:
                'Cuenta corriente principal para recibir transferencias interbancarias y depósitos de clientes.',
              estado: 'ACTIVO',
            },
            {
              codigo: 'CTA-BAN-002',
              nombre_cuenta: 'Cuenta de Ahorros Recaudación',
              entidad_bancaria: 'Banco Guayaquil',
              titular: 'Empresa Integrador S.A.',
              tipo_cuenta: 'Ahorros',
              nro_cuenta: '1209876543',
              ruc: '1790011223001',
              descripcion:
                'Cuenta de ahorros destinada a la recaudación de pagos con cheques y depósitos directos.',
              estado: 'ACTIVO',
            },
            {
              codigo: 'CTA-BAN-003',
              nombre_cuenta: 'Cuenta Especial Corriente',
              entidad_bancaria: 'Produbanco',
              titular: 'Empresa Integrador S.A. VIP',
              tipo_cuenta: 'Corriente',
              nro_cuenta: '5500987612',
              ruc: '1790011223001',
              descripcion:
                'Cuenta de uso exclusivo para cobros corporativos de clientes VIP y transferencias internacionales.',
              estado: 'ACTIVO',
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
    return this.mapToEntity(dbCuenta);
  }

  /**
   * Actualiza una cuenta bancaria existente en la base de datos real.
   */
  async update(
    id: string,
    cuentaActualizada: UpdateCuentaBancariaDto,
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
