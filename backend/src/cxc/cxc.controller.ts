import { Controller, Get, Param, Post, Body, UnauthorizedException } from '@nestjs/common';
import { CxcService } from './cxc.service';
import { LoginMockDto } from './dto/login-mock.dto';
import { ValidadorDeudaDto } from './dto/validador-deuda.dto';

@Controller('cxc')
export class CxcController {
  constructor(private readonly cxcService: CxcService) {}

  // 1. Endpoint Real: GET /cxc/estado-cuenta/:clienteId
  @Get('estado-cuenta/:clienteId')
  obtenerEstadoCuenta(@Param('clienteId') clienteId: string) {
    return this.cxcService.generarEstadoCuenta(clienteId);
  }

  // 2. Endpoint de Simulación: POST /cxc/auth/login-mock
  @Post('auth/login-mock')
  simularLogin(@Body() body: LoginMockDto) {
    // Simulación básica de credenciales
    if (body.usuario === 'admin' && body.contrasena === 'admin123') {
      return {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3ItMDAxIiwibmFtZSI6IkNhcmxvcyBSdWVkYSIsInJvbCI6IkFETUlOIn0.fGFrZXRva2VuX2Zvcl9jeGNfdGVzdGluZw',
        user: {
          id: 'usr-001',
          nombre: 'Carlos Rueda',
          rol: 'ADMIN'
        }
      };
    }
    
    throw new UnauthorizedException('Credenciales inválidas de prueba (Prueba con admin / admin123)');
  }

  // 3. Endpoint de Simulación: GET /cxc/validador-deuda/:clienteId
  @Get('validador-deuda/:clienteId')
  obtenerValidacionDeuda(@Param('clienteId') clienteId: string): Promise<ValidadorDeudaDto> {
    return this.cxcService.validarDeudaCliente(clienteId);
  }
}