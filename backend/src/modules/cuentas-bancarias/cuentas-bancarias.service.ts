import { Injectable } from '@nestjs/common';
import { CuentaBancariaEntity } from './cuenta-bancaria.entity';
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto';
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto';

@Injectable()
export class CuentasBancariasService {
  constructor() {}

  /**
   * Obtiene todas las cuentas bancarias (preparado para base de datos).
   */
  async findAll(): Promise<CuentaBancariaEntity[]> {
    return [];
  }

  /**
   * Busca una cuenta bancaria por su ID.
   */
  async findOne(id: string): Promise<CuentaBancariaEntity | null> {
    return null;
  }

  /**
   * Crea una nueva cuenta bancaria.
   */
  async create(
    cuenta: CreateCuentaBancariaDto,
  ): Promise<CuentaBancariaEntity | null> {
    return null;
  }

  /**
   * Actualiza una cuenta bancaria existente.
   */
  async update(
    id: string,
    cuentaActualizada: UpdateCuentaBancariaDto,
  ): Promise<CuentaBancariaEntity | null> {
    return null;
  }

  /**
   * Elimina una cuenta bancaria.
   */
  async remove(id: string): Promise<void> {
    return;
  }
}
