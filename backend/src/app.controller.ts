import { Controller, Get } from '@nestjs/common';
import { CxcService } from './cxc/cxc.service';
import { FacturasService } from './modules/facturas/facturas.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Integración (Salida)')
@Controller()
export class AppController {
  constructor(
    private readonly cxcService: CxcService,
    private readonly facturacionService: FacturasService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener reporte consolidado de deudas de todos los clientes para integración' })
  @ApiResponse({ status: 200, description: 'Listado de clientes con deudas y estados de crédito.' })
  async getConsolidadoDeuda() {
    const clientes = await this.facturacionService.findAllClientes();
    const resultado: any[] = [];

    for (const cli of clientes) {
      try {
        const cxcInfo = await this.cxcService.generarEstadoCuenta(cli.id);
        const valInfo = await this.cxcService.validarDeudaCliente(cli.id);
        
        const facturas = (await this.facturacionService.findAllFacturas())
          .filter(f => f.clienteId === cli.id);
        const totalCuentas = facturas.length;

        resultado.push({
          clienteId: cli.id,
          nombre: cli.nombre,
          ruc: cli.ruc,
          totalCuentas,
          montoTotalDeuda: cxcInfo.saldoPendiente,
          tieneDeudaActiva: valInfo.tieneDeudaActiva,
          estadoCliente: valInfo.estadoCliente,
          mensaje: valInfo.mensaje,
        });
      } catch (err) {
        console.error(`Error procesando cliente ${cli.id}:`, err);
      }
    }

    return resultado;
  }
}
