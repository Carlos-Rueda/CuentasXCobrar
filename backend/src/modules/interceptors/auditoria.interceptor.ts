import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TrazaData } from '../auditoria/auditoria.service';

interface IAuditoriaService {
  registrarTraza(data: TrazaData, tokenJwt: string): Promise<void>;
}

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  constructor(
    @Inject('AUDITORIA_PACKAGE') private readonly auditoriaService: IAuditoriaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const method = request.method?.toUpperCase();
    
    // Solo auditar funciones de escritura/modificación (POST, PUT, PATCH, DELETE) o consulta de estado de cuenta
    const isVital = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) || request.url?.includes('estado-cuenta');
    if (!isVital) {
      return next.handle();
    }
    
    // Simulación de usuario autenticado (se puede extraer de un JWT Guard más adelante)
    const usuario = request.user || { id: 'usr-001', nombre: 'Carlos Rueda' };
    const ip = request.ip || '127.0.0.1';
    const accion = `${request.method} ${request.url}`;

    // Extraer y limpiar el token real del header de la petición actual
    const token = request.headers.authorization?.split(' ')[1];

    return next.handle().pipe(
      tap({
        next: (data) => {
          const traza: TrazaData = {
            usuario_id: usuario.id,
            accion: accion,
            modulo: 'CUENTAS_POR_COBRAR',
            ip_origen: ip,
            marca_tiempo: new Date().toISOString(),
            detalles: JSON.stringify({ status: 'SUCCESS', responseSize: JSON.stringify(data || {}).length }),
          };

          if (token) {
            this.auditoriaService.registrarTraza(traza, token).catch(err => {
              console.error('❌ Error asíncrono en el interceptor de auditoría:', err.message);
            });
          }
        },
      }),
    );
  }
}
