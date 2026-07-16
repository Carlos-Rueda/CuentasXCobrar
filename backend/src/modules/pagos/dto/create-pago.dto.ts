import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PagoDetalleDto {
  @ApiProperty({ example: 'fac-101', description: 'ID de la factura' })
  @IsString()
  facturaId: string;

  @ApiProperty({ example: 100.0, description: 'Monto pagado' })
  @IsNumber()
  montoPagado: number;
}

export class CreatePagoDto {
  @ApiProperty({ example: 'cli-001', description: 'ID del cliente' })
  @IsString()
  clienteId: string;

  @ApiProperty({ example: 'cb-001', description: 'ID de la cuenta bancaria' })
  @IsString()
  cuentaBancariaId: string;

  @ApiProperty({
    example: 'Pago por servicios de consultoría',
    description: 'Descripción del pago',
  })
  @IsString()
  @IsOptional()
  descripcion: string;

  @ApiProperty({
    type: [PagoDetalleDto],
    required: true,
    description: 'Detalle de facturas pagadas',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PagoDetalleDto)
  detalles: PagoDetalleDto[];
}
