import { ApiProperty } from '@nestjs/swagger';

export class CuentaBancariaEntity {
  @ApiProperty({
    example: '1',
    description: 'ID único de la cuenta bancaria (UUID)',
  })
  id: string;

  @ApiProperty({
    example: 'CTA-BAN-001',
    description: 'Código único identificador de la cuenta',
  })
  codigo: string;

  @ApiProperty({
    example: 'Cuenta Corriente Principal',
    description: 'Nombre descriptivo de la cuenta',
  })
  nombreCuenta: string;

  @ApiProperty({
    example: 'Banco Pichincha',
    description: 'Entidad financiera del banco',
  })
  entidadBancaria: string;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Titular de la cuenta bancaria',
  })
  titular: string;

  @ApiProperty({
    example: 'Ahorros',
    description: 'Tipo de cuenta bancaria (Ahorros / Corriente)',
  })
  tipoCuenta: string;

  @ApiProperty({
    example: '2200456789',
    description: 'Número de cuenta bancaria',
  })
  nroCuenta: string;

  @ApiProperty({
    example: '1790011223001',
    description: 'Número de RUC asociado a la cuenta',
  })
  ruc: string;

  @ApiProperty({
    example: 'Cuenta principal para cobros',
    description: 'Descripción opcional',
    required: false,
  })
  descripcion?: string;

  @ApiProperty({
    example: 'ACTIVO',
    description: 'Estado de la cuenta bancaria (ACTIVO / INACTIVO)',
  })
  estado: string;
}
