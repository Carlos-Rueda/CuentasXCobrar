import { DetalleFacturaMockDto } from './detalle-factura-mock.dto';

export class FacturaMockDto {
  id: string;
  numero: string;
  clienteId: string;
  fechaEmision: string;
  total: number;
  estado: 'PENDIENTE' | 'PAGADA' | 'ANULADA';
  detalles: DetalleFacturaMockDto[]; // <- Ahora TypeScript ya sabrá qué es esto
}