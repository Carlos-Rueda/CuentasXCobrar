export class ValidadorDeudaDto {
  clienteId: string;
  tieneDeudaActiva: boolean;
  montoTotalDeuda: number;
  estadoCliente: 'APTO_PARA_CREDITO' | 'BLOQUEADO_POR_MORA';
  mensaje: string;
}