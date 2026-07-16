import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  UseInterceptors, // 👈 Añadido para el manejo de interceptores
} from '@nestjs/common';
import { CuentasCobrarService } from './cuentas-cobrar.service';
import { ValidadorDeudaDto } from './dto/validador-deuda.dto';
import { EstadoCuentaDto } from './dto/estado-cuenta.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuditoriaInterceptor } from '../interceptors/auditoria.interceptor'; // Ajustado a la estructura del módulo
import * as crypto from 'crypto';

@ApiTags('Cuentas por Cobrar (Módulo CXC)')
@Controller('cxc')
@UseInterceptors(AuditoriaInterceptor) // 👈 Automatiza las pistas de auditoría simuladas para todo el controlador
export class CuentasCobrarController {
  constructor(private readonly cuentasCobrarService: CuentasCobrarService) {}

  // 1. Endpoint Real: GET /cxc/estado-cuenta/:clienteId
  @Get('estado-cuenta/:clienteId')
  @ApiOperation({ summary: 'Obtener estado de cuenta completo del cliente' })
  @ApiParam({
    name: 'clienteId',
    description: 'ID del cliente a consultar',
    example: 'cli-001',
  })
  @ApiResponse({
    status: 200,
    description:
      'Historial de movimientos, montos facturados, cobrados y saldo pendiente neto.',
    type: EstadoCuentaDto,
  })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado.' })
  obtenerEstadoCuenta(@Param('clienteId') clienteId: string) {
    return this.cuentasCobrarService.generarEstadoCuenta(clienteId);
  }

  // 3. Endpoint de Simulación: GET /cxc/validador-deuda/:clienteId
  @Get('validador-deuda/:clienteId')
  @ApiOperation({
    summary:
      'Validar deuda de cliente y estado de aprobación para crédito (Integración con Facturación)',
  })
  @ApiParam({
    name: 'clienteId',
    description: 'ID del cliente a evaluar',
    example: 'cli-001',
  })
  @ApiResponse({
    status: 200,
    description:
      'Verificación de deudas pendientes y estado crediticio (APTO o BLOQUEADO).',
    type: ValidadorDeudaDto,
  })
  obtenerValidacionDeuda(
    @Param('clienteId') clienteId: string,
  ): Promise<ValidadorDeudaDto> {
    return this.cuentasCobrarService.validarDeudaCliente(clienteId);
  }

  // 4. API de Salida: GET /cxc/clientes-saldos
  @Get('clientes-saldos')
  @ApiTags('API de Salida')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Listar clientes con saldo a pagar (para módulos externos)',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de clientes con deudas pendientes mayor a 0.',
  })
  async getClientesSaldos() {
    return this.cuentasCobrarService.getClientesSaldos();
  }

  @Get('cuentas-saldos')
  @ApiTags('API de Salida')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Listar cuentas bancarias con su saldo disponible consolidado (para módulos externos)',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de cuentas bancarias con ID, nombre y saldo disponible.',
  })
  async getCuentasSaldos() {
    return this.cuentasCobrarService.generarCuentasSaldos();
  }

  @Post('token')
  @ApiTags('API de Salida')
  @ApiOperation({ summary: 'Generar token JWT para consumir el API de Salida' })
  @ApiResponse({
    status: 201,
    description: 'Retorna el token JWT generado para autenticación.',
  })
  async generarToken() {
    const secret = process.env.JWT_SECRET || 'cxc_grupo_secret_key_2026';
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: 'external-module',
      role: 'external',
      exp: Math.floor(Date.now() / 1000) + 10 * 60, // 10 minutos
    };
    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${headerB64}.${payloadB64}`);
    const signatureB64 = hmac.digest('base64url');
    const token = `${headerB64}.${payloadB64}.${signatureB64}`;
    return { token };
  }
}
