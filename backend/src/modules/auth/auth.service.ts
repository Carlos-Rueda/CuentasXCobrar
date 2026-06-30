import { Injectable, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  async login(dto: LoginDto, ipUsuario: string) {
    const url = process.env.AUTH_API_URL || 'https://712286fsib.execute-api.us-east-1.amazonaws.com/default/api-auth-central';
    const apiKey = process.env.MODULE_API_KEY || 'dev_key_cxc_111';

    try {
      const response = await axios.post(
        url,
        {
          api_key: apiKey,
          usuario: dto.usuario,
          clave: dto.clave,
          ip: ipUsuario,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 429) {
          throw new HttpException(
            'IP bloqueada por 3 minutos por múltiples intentos fallidos',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        if (error.response.status === 401) {
          throw new UnauthorizedException('Credenciales incorrectas');
        }
        throw new HttpException(
          error.response.data?.message || 'Error de autenticación',
          error.response.status,
        );
      }
      throw new HttpException(
        error.message || 'Error al conectar con el Identity Provider',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
