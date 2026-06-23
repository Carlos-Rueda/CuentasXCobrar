import { OmitType } from '@nestjs/swagger';
import { PagoEntity } from '../pago.entity';

export class CreatePagoDto extends OmitType(PagoEntity, [
  'id',
  'fecha',
] as const) {}
