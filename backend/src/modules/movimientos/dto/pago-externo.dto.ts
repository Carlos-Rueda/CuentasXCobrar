import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PagoExternoDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID válido de la cuenta bancaria de origen',
  })
  @IsUUID()
  @IsNotEmpty()
  cuenta_origen_id: string;

  @ApiProperty({
    example: 150.5,
    description: 'Monto del pago externo (mínimo 0.01)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  monto: number;

  @ApiProperty({
    example: 'Pago de servicio de agua potable del local principal',
    description: 'Descripción detallada del pago',
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string;
}
