import { ApiProperty } from '@nestjs/swagger';

export class CuentaBancariaEntity {
  @ApiProperty({ example: '1718210344000', description: 'ID único de la cuenta bancaria (generado automáticamente)' })
  id: string;

  @ApiProperty({ example: 'Banco Pichincha', description: 'Nombre de la entidad bancaria' })
  banco: string;

  @ApiProperty({ example: '2200123456', description: 'Número de cuenta' })
  numeroCuenta: string;

  @ApiProperty({ example: 'Ahorros', description: 'Tipo de cuenta (Ahorros, Corriente, etc.)' })
  tipoCuenta: string;

  @ApiProperty({ example: 1250.75, description: 'Saldo actual de la cuenta' })
  saldo: number;
}

