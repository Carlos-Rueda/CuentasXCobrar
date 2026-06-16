import { ApiProperty } from '@nestjs/swagger';

export class CuentaBancariaEntity {
  @ApiProperty({ example: '1', description: 'ID único de la cuenta bancaria (generado automáticamente)' })
  id: string;

  @ApiProperty({ example: 'CTA-BAN-001', description: 'Código único identificador de la cuenta' })
  codigo: string;

  @ApiProperty({ example: 'Cuenta de Ahorros', description: 'Nombre de la cuenta' })
  nombreCuenta: string;

  @ApiProperty({ example: 'Banco Pichincha', description: 'Nombre de la entidad bancaria' })
  entidadBancaria: string;

  @ApiProperty({ example: 'Cuenta principal para cobros', description: 'Descripción opcional', required: false })
  descripcion?: string;

  @ApiProperty({ example: 'ACTIVO', description: 'Estado de la cuenta bancaria (ACTIVO / INACTIVO)' })
  estado: string;
}


