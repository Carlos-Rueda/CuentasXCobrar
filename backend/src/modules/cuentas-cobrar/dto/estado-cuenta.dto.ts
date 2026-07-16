import { ApiProperty } from '@nestjs/swagger';

export class MovimientoDto {
  @ApiProperty({
    description: 'Fecha de realización del movimiento',
    example: '2026-06-01',
  })
  fecha: string;

  @ApiProperty({
    description: 'Referencia al documento comercial',
    example: 'Factura N° 001-001-000000123',
  })
  documento: string; // Ej: "Factura 001-001-123" o "Recibo de Pago 045"

  @ApiProperty({
    description:
      'Tipo de movimiento financiero (Débito aumenta deuda, Crédito disminuye/abona)',
    enum: ['DEBITO', 'CREDITO'],
    example: 'DEBITO',
  })
  tipo: 'DEBITO' | 'CREDITO'; // DEBITO = Aumenta la deuda (Factura), CREDITO = Disminuye (Pago)

  @ApiProperty({
    description: 'Valor del movimiento comercial',
    example: 150.0,
  })
  monto: number;
}

export class EstadoCuentaDto {
  @ApiProperty({ description: 'ID único del cliente', example: 'cli-001' })
  clienteId: string;

  @ApiProperty({
    description: 'Nombre completo o razón social del cliente',
    example: 'Carlos Rueda',
  })
  nombreCliente: string;

  @ApiProperty({
    description: 'RUC o cédula de identidad del cliente',
    example: '1004123456001',
  })
  ruc: string;

  @ApiProperty({
    description: 'Suma de todas las facturas emitidas al cliente (Débitos)',
    example: 195.0,
  })
  totalFacturado: number;

  @ApiProperty({
    description:
      'Suma de todos los abonos o pagos realizados por el cliente (Créditos)',
    example: 150.0,
  })
  totalPagado: number;

  @ApiProperty({
    description:
      'Saldo neto por cobrar al cliente (Total Facturado - Total Pagado)',
    example: 45.0,
  })
  saldoPendiente: number; // totalFacturado - totalPagado

  @ApiProperty({
    description: 'Historial cronológico de todos los movimientos de la cuenta',
    type: [MovimientoDto],
  })
  historial: MovimientoDto[];
}
