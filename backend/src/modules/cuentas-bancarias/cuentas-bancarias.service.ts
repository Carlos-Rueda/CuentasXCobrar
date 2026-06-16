import { Injectable, NotFoundException } from '@nestjs/common';
import { CuentaBancariaEntity } from './cuenta-bancaria.entity';
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto';
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto';

@Injectable()
export class CuentasBancariasService {
  private cuentas: CuentaBancariaEntity[] = [
    {
      id: '1',
      codigo: 'CTA-BAN-001',
      nombreCuenta: 'Cuenta de Ahorros',
      entidadBancaria: 'Banco Pichincha',
      descripcion: 'Cuenta principal para depósitos de clientes',
      estado: 'ACTIVO',
    },
    {
      id: '2',
      codigo: 'CTA-BAN-002',
      nombreCuenta: 'Cuenta Corriente',
      entidadBancaria: 'Banco Guayaquil',
      descripcion: 'Cuenta corriente para cobros comerciales',
      estado: 'ACTIVO',
    },
  ];

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

  create(cuenta: CreateCuentaBancariaDto & { id?: string }): CuentaBancariaEntity {
    const nuevaCuenta: CuentaBancariaEntity = {
      id: cuenta.id || Date.now().toString(),
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


