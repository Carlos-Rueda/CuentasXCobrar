import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateCuentaBancariaDto {
  @ApiProperty({ example: 'CTA-BAN-001', description: 'Código único identificador', required: false })
  @IsString()
  @IsOptional()
  codigo?: string;

  @ApiProperty({ example: 'Cuenta Corriente Principal', description: 'Nombre descriptivo' })
  @IsString()
  @IsNotEmpty()
  nombreCuenta: string;

  @ApiProperty({ example: 'Banco Pichincha', description: 'Nombre de la entidad bancaria' })
  @IsString()
  @IsNotEmpty()
  entidadBancaria: string;

  @ApiProperty({ example: 'Juan Pérez', description: 'Titular de la cuenta bancaria' })
  @IsString()
  @IsNotEmpty()
  titular: string;

  @ApiProperty({ example: 'Corriente', description: 'Tipo de cuenta (Corriente / Ahorros)' })
  @IsString()
  @IsNotEmpty()
  tipoCuenta: string;

  @ApiProperty({ example: '2200456789', description: 'Número de cuenta bancaria' })
  @IsString()
  @IsNotEmpty()
  nroCuenta: string;

  @ApiProperty({ example: '1790011223001', description: 'Número de RUC' })
  @IsString()
  @IsNotEmpty()
  ruc: string;

  @ApiProperty({ example: 'Cuenta principal para cobros', description: 'Descripción opcional', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ example: 'ACTIVO', description: 'Estado de la cuenta bancaria', required: false })
  @IsString()
  @IsOptional()
  @IsIn(['ACTIVO', 'INACTIVO'])
  estado?: string;
}
