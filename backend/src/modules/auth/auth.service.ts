import { Injectable, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  async login(dto: LoginDto, ipUsuario: string) {
    const url = process.env.SECURITY_GRAPHQL_URL || 'https://proyecto-moduloseguridad.onrender.com/graphql/';

    try {
      const response = await axios.post(
        url,
        {
          query: `mutation { login(username: "${dto.usuario}", password: "${dto.clave}") { success message token } }`
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const loginResult = response.data?.data?.login;
      if (!loginResult) {
        throw new UnauthorizedException('No se recibió respuesta válida del módulo de seguridad');
      }

      if (!loginResult.success) {
        throw new UnauthorizedException(loginResult.message || 'Credenciales incorrectas');
      }

      return {
        success: true,
        message: loginResult.message || 'Autenticación exitosa',
        token: loginResult.token,
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error.response) {
        throw new HttpException(
          error.response.data?.errors?.[0]?.message || error.response.data?.message || 'Error de autenticación',
          error.response.status || HttpStatus.UNAUTHORIZED,
        );
      }
      throw new HttpException(
        error.message || 'Error al conectar con el módulo de seguridad',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
