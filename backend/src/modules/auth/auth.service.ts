import { Injectable, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  async login(dto: LoginDto, ipUsuario: string) {
    const url = process.env.AUTH_API_URL;
    const apiKey = process.env.MODULE_API_KEY;

    if (!url) {
      throw new HttpException(
        'AUTH_API_URL no está configurado en las variables de entorno',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

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
