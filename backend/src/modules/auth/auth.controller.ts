import { Controller, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login de usuario mediante el Identity Provider corporativo',
  })
  @ApiResponse({ status: 200, description: 'Autenticación exitosa' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas' })
  @ApiResponse({
    status: 429,
    description: 'IP bloqueada por múltiples intentos fallidos',
  })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    let ipUsuario = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';
    if (Array.isArray(ipUsuario)) {
      ipUsuario = ipUsuario[0];
    } else if (typeof ipUsuario === 'string') {
      ipUsuario = ipUsuario.split(',')[0].trim();
    }

    return this.authService.login(dto, ipUsuario);
  }
}
