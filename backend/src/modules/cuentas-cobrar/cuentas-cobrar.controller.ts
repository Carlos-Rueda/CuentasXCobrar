import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UnauthorizedException,
  UseGuards,
  UseInterceptors, // 👈 Añadido para el manejo de interceptores
} from '@nestjs/common';
import { CuentasCobrarService } from './cuentas-cobrar.service';
import { LoginMockDto } from './dto/login-mock.dto';
import { ValidadorDeudaDto } from './dto/validador-deuda.dto';
import { EstadoCuentaDto } from './dto/estado-cuenta.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
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

  // 2. Endpoint de Simulación: POST /cxc/auth/login-mock
  @Post('auth/login-mock')
  @ApiOperation({
    summary: 'Simular inicio de sesión administrativo (admin / admin123)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Autenticación exitosa. Retorna token ficticio y datos del usuario.',
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  simularLogin(@Body() body: LoginMockDto) {
    // Simulación básica de credenciales
    if (body.usuario === 'admin' && body.contrasena === 'admin123') {
      return {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3ItMDAxIiwibmFtZSI6IkNhcmxvcyBSdWVkYSIsInJvbCI6IkFETUlOIn0.fGFrZXRva2VuX2Zvcl9jeGNfdGVzdGluZw',
        user: {
          id: 'usr-001',
          nombre: 'Carlos Rueda',
          rol: 'ADMIN',
        },
      };
    }

    throw new UnauthorizedException(
      'Credenciales inválidas de prueba (Prueba con admin / admin123)',
    );
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
  @ApiOperation({ summary: 'Listar clientes con saldo a pagar (para módulos externos)' })
  @ApiResponse({
    status: 200,
    description: 'Listado de clientes con deudas pendientes mayor a 0.',
  })
  async getClientesSaldos() {
    return this.cuentasCobrarService.getClientesSaldos();
  }

  // 5. Integración: GET /cxc/auth/generate-token
  @Get('auth/generate-token')
  @ApiTags('API de Salida')
  @ApiOperation({ summary: 'Generar token JWT de integración para uso de módulos externos' })
  @ApiResponse({
    status: 200,
    description: 'Retorna un token JWT válido generado con el secreto del sistema.',
  })
  generarTokenIntegracion() {
    const secret = process.env.JWT_SECRET || 'cxc_grupo_secret_key_2026';
    const payload = {
      iss: 'cxc-module',
      aud: 'facturacion-module',
      rol: 'integrador',
      purpose: 'facturacion-integration',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365), // 1 año
    };
    const header = { alg: 'HS256', typ: 'JWT' };
    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${headerB64}.${payloadB64}`);
    const signatureB64 = hmac.digest('base64url');
    const token = `${headerB64}.${payloadB64}.${signatureB64}`;
    return {
      success: true,
      token,
      message: 'Usa este token en la cabecera Authorization: Bearer <token> para consumable la API de Salida.',
    };
  }
}