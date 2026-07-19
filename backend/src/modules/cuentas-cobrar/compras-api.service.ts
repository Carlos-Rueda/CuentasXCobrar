import { Injectable } from '@nestjs/common';

@Injectable()
export class ComprasApiService {
  private readonly apiUrl = 'http://compras-alb-1632153594.us-east-1.elb.amazonaws.com/api/cxc/gastos';

  /**
   * Obtiene la lista de gastos registrados en el módulo de compras.
   * Maneja errores externamente para evitar caídas en el sistema local.
   */
  async obtenerGastos(): Promise<any[]> {
    try {
      // Usar un timeout corto para evitar bloqueos si el servidor externo está offline
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(this.apiUrl, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const body = await response.json();
        return body.data || [];
      } else {
        console.warn(`Compras API retornó status ${response.status}`);
      }
    } catch (error) {
      console.error('Error al obtener gastos desde Compras API:', error);
    }
    return [];
  }
}
