import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { CuentasCobrarService } from './cuentas-cobrar.service';
import { LoginMockDto } from './dto/login-mock.dto';
import { ValidadorDeudaDto } from './dto/validador-deuda.dto';
import { EstadoCuentaDto } from './dto/estado-cuenta.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Cuentas por Cobrar (Módulo CXC)')
@Controller('cxc')
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
}
