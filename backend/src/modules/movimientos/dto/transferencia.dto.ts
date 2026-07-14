import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TransferenciaDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID de la cuenta bancaria de origen',
  })
  @IsUUID()
  @IsNotEmpty()
  cuenta_origen_id: string;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440000',
    description: 'UUID de la cuenta bancaria de destino',
  })
  @IsUUID()
  @IsNotEmpty()
  cuenta_destino_id: string;

  @ApiProperty({
    example: 150.00,
    description: 'Monto a transferir (mínimo 0.01)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  monto: number;

  @ApiProperty({
    example: 'Transferencia para pago de nómina interna',
    description: 'Descripción de la transferencia',
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string;
}
