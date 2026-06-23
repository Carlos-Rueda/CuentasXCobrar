import { ApiProperty } from '@nestjs/swagger';

export class PagoDetalle {
  @ApiProperty({ example: 'F001', description: 'ID de la factura asociada' })
  facturaId: string;

  @ApiProperty({ example: 50.0, description: 'Monto abonado a la factura' })
  montoAbonado: number;
}

export class PagoEntity {
  @ApiProperty({ example: '1718210344000', description: 'ID único del pago' })
  id: string;

  @ApiProperty({
    example: 'C1',
    description: 'ID del cliente que realiza el pago',
  })
  clienteId: string;

  @ApiProperty({
    example: '1718210344000',
    description: 'ID de la cuenta bancaria de destino',
  })
  cuentaBancariaId: string;

  @ApiProperty({ example: 150.0, description: 'Monto total abonado' })
  montoTotal: number;

  @ApiProperty({
    example: '2026-06-13T17:38:00.000Z',
    description: 'Fecha del pago',
  })
  fecha: string;

  @ApiProperty({
    type: [PagoDetalle],
    description: 'Detalle de facturas abonadas',
  })
  detalles: PagoDetalle[];
}
