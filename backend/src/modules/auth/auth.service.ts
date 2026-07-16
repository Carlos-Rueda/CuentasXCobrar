import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  async login(dto: LoginDto, ipUsuario: string) {
    const url =
      process.env.SECURITY_GRAPHQL_URL ||
      'https://proyecto-moduloseguridad.onrender.com/graphql/';

    try {
      const response = await axios.post(
        url,
        {
          query: `mutation { login(username: "${dto.usuario}", password: "${dto.clave}") { success message token } }`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const loginResult = response.data?.data?.login;
      if (!loginResult) {
        throw new UnauthorizedException(
          'No se recibió respuesta válida del módulo de seguridad',
        );
      }

      if (!loginResult.success) {
        throw new UnauthorizedException(
          loginResult.message || 'Credenciales incorrectas',
        );
      }

      let hasPermissions = false;
      try {
        const payloadPart = loginResult.token.split('.')[1];
        const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const payloadJson = Buffer.from(base64, 'base64').toString('utf8');
        const payload = JSON.parse(payloadJson);
        if (
          Array.isArray(payload.permissions) &&
          payload.permissions.some((p: string) => p.startsWith('CXC_'))
        ) {
          hasPermissions = true;
        }
      } catch (e) {
        console.error('Error al decodificar token en login:', e);
      }

      if (!hasPermissions) {
        throw new UnauthorizedException(
          'El usuario no cuenta con permisos asignados para acceder al módulo de Cuentas por Cobrar',
        );
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
          error.response.data?.errors?.[0]?.message ||
            error.response.data?.message ||
            'Error de autenticación',
          error.response.status || HttpStatus.UNAUTHORIZED,
        );
      }
      throw new HttpException(
        error.message || 'Error al conectar con el módulo de seguridad',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async forgotPassword(email: string) {
    const graphqlUrl =
      process.env.SECURITY_GRAPHQL_URL ||
      'https://proyecto-moduloseguridad.onrender.com/graphql/';
    const baseUrl = graphqlUrl.replace('/graphql/', '').replace('/graphql', '');
    const url = `${baseUrl}/api/auth/forgot-password/`;

    try {
      const response = await axios.post(
        url,
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(
          error.response.data?.message || 'Error al solicitar código',
          error.response.status || HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        error.message || 'Error al conectar con el módulo de seguridad',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyCode(email: string, codigo: string) {
    const graphqlUrl =
      process.env.SECURITY_GRAPHQL_URL ||
      'https://proyecto-moduloseguridad.onrender.com/graphql/';
    const baseUrl = graphqlUrl.replace('/graphql/', '').replace('/graphql', '');
    const url = `${baseUrl}/api/auth/verify-code/`;

    try {
      const response = await axios.post(
        url,
        { email, codigo },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(
          error.response.data?.message || 'Código inválido',
          error.response.status || HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        error.message || 'Error al conectar con el módulo de seguridad',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async resetPassword(email: string, codigo: string, newPassword: string) {
    const graphqlUrl =
      process.env.SECURITY_GRAPHQL_URL ||
      'https://proyecto-moduloseguridad.onrender.com/graphql/';
    const baseUrl = graphqlUrl.replace('/graphql/', '').replace('/graphql', '');
    const url = `${baseUrl}/api/auth/reset-password/`;

    try {
      const response = await axios.post(
        url,
        { email, codigo, new_password: newPassword },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(
          error.response.data?.message || 'Error al cambiar la contraseña',
          error.response.status || HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        error.message || 'Error al conectar con el módulo de seguridad',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
