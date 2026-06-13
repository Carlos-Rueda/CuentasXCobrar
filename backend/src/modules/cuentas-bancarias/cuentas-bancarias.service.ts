import { Injectable, NotFoundException } from '@nestjs/common';
import { CuentaBancariaEntity } from './cuenta-bancaria.entity';
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto';
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto';

@Injectable()
export class CuentasBancariasService {
  private cuentas: CuentaBancariaEntity[] = [];

  findAll(): CuentaBancariaEntity[] {
    return this.cuentas;
  }

  findOne(id: string): CuentaBancariaEntity {
    const cuenta = this.cuentas.find((c) => c.id === id);
    if (!cuenta) {
      throw new NotFoundException(`Cuenta bancaria con ID ${id} no encontrada`);
    }
    return cuenta;
  }

  create(cuenta: CreateCuentaBancariaDto): CuentaBancariaEntity {
    const nuevaCuenta: CuentaBancariaEntity = {
      id: Date.now().toString(),
      ...cuenta,
    };
    this.cuentas.push(nuevaCuenta);
    return nuevaCuenta;
  }

  update(id: string, cuentaActualizada: UpdateCuentaBancariaDto): CuentaBancariaEntity {
    const index = this.cuentas.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new NotFoundException(`Cuenta bancaria con ID ${id} no encontrada`);
    }

    this.cuentas[index] = {
      ...this.cuentas[index],
      ...cuentaActualizada,
      id,
    };
    return this.cuentas[index];
  }

  remove(id: string): void {
    const index = this.cuentas.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new NotFoundException(`Cuenta bancaria con ID ${id} no encontrada`);
    }
    this.cuentas.splice(index, 1);
  }
}

