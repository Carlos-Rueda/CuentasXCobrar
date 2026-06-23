import { OmitType } from '@nestjs/swagger';
import { CuentaBancariaEntity } from '../cuenta-bancaria.entity';

export class CreateCuentaBancariaDto extends OmitType(CuentaBancariaEntity, [
  'id',
] as const) {}
