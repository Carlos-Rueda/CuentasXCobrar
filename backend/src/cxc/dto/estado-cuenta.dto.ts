export class MovimientoDto {
  fecha: string;
  documento: string; // Ej: "Factura 001-001-123" o "Recibo de Pago 045"
  tipo: 'DEBITO' | 'CREDITO'; // DEBITO = Aumenta la deuda (Factura), CREDITO = Disminuye (Pago)
  monto: number;
}

export class EstadoCuentaDto {
  clienteId: string;
  nombreCliente: string;
  ruc: string;
  totalFacturado: number;
  totalPagado: number;
  saldoPendiente: number; // totalFacturado - totalPagado
  historial: MovimientoDto[];
}