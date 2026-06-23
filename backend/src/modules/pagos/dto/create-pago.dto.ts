import { ApiProperty } from '@nestjs/swagger';

export class PagoDetalleDto {
  @ApiProperty({ example: 'fac-101', description: 'ID de la factura' })
  facturaId: string;

  @ApiProperty({ example: 100.0, description: 'Monto pagado/abonado' })
  montoAbonado: number;
}

export class CreatePagoDto {
  @ApiProperty({ example: 'cli-001', description: 'ID del cliente' })
  clienteId: string;

  @ApiProperty({ example: 'cb-001', description: 'ID de la cuenta bancaria' })
  cuentaBancariaId: string;

  @ApiProperty({ example: 'Pago por servicios de consultoría', description: 'Descripción del pago' })
  descripcion: string;

  @ApiProperty({ type: [PagoDetalleDto], required: false, description: 'Detalle de facturas abonadas' })
  detalles?: PagoDetalleDto[];
}
