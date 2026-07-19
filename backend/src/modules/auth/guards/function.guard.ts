import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class FunctionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isExternalAllowed = this.reflector.getAllAndOverride<boolean>('isExternalAllowed', [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredFunction = this.reflector.getAllAndOverride<string>('requireFunction', [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && (user.role === 'external' || (Array.isArray(user.roles) && user.roles.includes('external')))) {
      if (!isExternalAllowed) {
        throw new ForbiddenException('Acceso denegado: El token externo no tiene autorización para esta ruta interna');
      }
    }

    if (!requiredFunction) {
      return true;
    }

    if (!user) {
      throw new ForbiddenException('No tienes privilegios para ejecutar esta función');
    }

    const userFunctions = user.funciones || user.roles || [];
    if (!userFunctions.includes(requiredFunction)) {
      throw new ForbiddenException('No tienes privilegios para ejecutar esta función');
    }

    return true;
  }
}
