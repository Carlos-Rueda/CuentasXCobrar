import { ApiProperty } from '@nestjs/swagger';

export class DetalleFacturaDto {
  @ApiProperty({ example: 'Licencia Software' })
  producto: string;

  @ApiProperty({ example: 1 })
  cantidad: number;

  @ApiProperty({ example: 150.0 })
  precioUnitario: number;
}

export class FacturaDto {
  @ApiProperty({ example: 'fac-101' })
  id: string;

  @ApiProperty({ example: '001-001-000000123' })
  numero: string;

  @ApiProperty({ example: 'cli-001' })
  clienteId: string;

  @ApiProperty({ example: '2026-06-01' })
  fechaEmision: string;

  @ApiProperty({ example: 150.0 })
  total: number;

  @ApiProperty({ example: 'PENDIENTE' })
  estado: string;

  @ApiProperty({ type: [DetalleFacturaDto] })
  detalles: DetalleFacturaDto[];
}
