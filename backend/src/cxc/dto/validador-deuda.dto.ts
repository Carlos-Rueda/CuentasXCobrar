import { ApiProperty } from '@nestjs/swagger';

export class ValidadorDeudaDto {
  @ApiProperty({ description: 'ID único del cliente', example: 'cli-001' })
  clienteId: string;

  @ApiProperty({
    description: 'Indica si el cliente posee deuda activa pendiente de pago',
    example: true,
  })
  tieneDeudaActiva: boolean;

  @ApiProperty({
    description: 'Monto acumulado total de la deuda del cliente',
    example: 150.0,
  })
  montoTotalDeuda: number;

  @ApiProperty({
    description: 'Estado crediticio del cliente',
    enum: ['APTO_PARA_CREDITO', 'BLOQUEADO_POR_MORA'],
    example: 'APTO_PARA_CREDITO',
  })
  estadoCliente: 'APTO_PARA_CREDITO' | 'BLOQUEADO_POR_MORA';

  @ApiProperty({
    description: 'Mensaje informativo detallado sobre el estado del crédito',
    example: 'El cliente posee deudas pero está dentro del límite autorizado.',
  })
  mensaje: string;
}
