import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as protobuf from 'protobufjs';
import * as path from 'path';

export interface TrazaData {
  usuario_id: string;
  accion: string;
  modulo: string;
  ip_origen: string;
  marca_tiempo: string;
  detalles: string;
}

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);
  private readonly authUrl = 'https://712286fslb.execute-api.us-east-1.amazonaws.com/default/api-auth-central';
  private readonly auditoriaUrl = 'https://98l52rpey8.execute-api.us-east-1.amazonaws.com/default/api-pistas-auditoria';
  
  private jwtToken: string = '';
  private tokenExpiresAt: number = 0;
  
  private protoRoot: protobuf.Root | null = null;

  constructor(private readonly httpService: HttpService) {}

  async onModuleInit() {
    try {
      let protoPath = path.resolve(__dirname, 'auditoria.proto');
      
      const fs = require('fs');
      if (!fs.existsSync(protoPath)) {
        // Fallback para cuando NestJS anida 'src' en 'dist' pero copia el asset en la raíz
        protoPath = path.resolve(process.cwd(), 'dist', 'modules', 'auditoria', 'auditoria.proto');
        
        if (!fs.existsSync(protoPath)) {
           // Fallback final apuntando al código fuente directamente
           protoPath = path.resolve(process.cwd(), 'src', 'modules', 'auditoria', 'auditoria.proto');
        }
      }

      this.protoRoot = await protobuf.load(protoPath);
      this.logger.log('Archivo Protobuf de auditoría cargado correctamente desde: ' + protoPath);
    } catch (error) {
      this.logger.error('Error cargando el archivo auditoria.proto', error);
    }
  }

  private async authenticate(): Promise<string> {
    const now = Date.now();
    // Si tenemos un token válido (dando 5 minutos de margen antes de expirar)
    if (this.jwtToken && this.tokenExpiresAt > now + 5 * 60 * 1000) {
      return this.jwtToken;
    }

    try {
      // Estas credenciales deben venir de un .env usando ConfigService idealmente.
      const payload = {
        api_key: process.env.AUDITORIA_API_KEY || 'dev_key_tu_modulo_123',
        usuario: process.env.AUDITORIA_USER || 'admin_cxc',
        clave: process.env.AUDITORIA_PASS || 'password123',
        ip: '127.0.0.1', // O la IP del servidor backend
      };

      const response = await firstValueFrom(
        this.httpService.post(this.authUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      if (response.data?.success && response.data?.token) {
        this.jwtToken = response.data.token;
        // El manual dice que dura 8 horas (8 * 60 * 60 * 1000 ms)
        this.tokenExpiresAt = now + 8 * 60 * 60 * 1000; 
        this.logger.log('Autenticación con el Módulo de Seguridad exitosa.');
        return this.jwtToken;
      } else {
        throw new Error('Respuesta de autenticación inválida');
      }
    } catch (error) {
      this.logger.error('Fallo la autenticación con el Módulo de Seguridad', error?.response?.data || error.message);
      throw error;
    }
  }

  public async registrarTraza(data: TrazaData): Promise<void> {
    try {
      // 1. Armar el payload localmente primero para imprimirlo, incluso si la red falla
      const payloadLocal = {
        token: '[PENDIENTE_DE_RED]',
        id_funcion: this.mapModuloToId(data.modulo, data.accion), 
        accion: data.accion, // Verbo u operación
        descripcion: `Acción en módulo ${data.modulo}`, 
        observacion: data.detalles, 
        ip_usuario: data.ip_origen,
      };

      // 2. Imprimir siempre el registro en consola
      this.logger.log(`Registrando Pista de Auditoría (Local): \n${JSON.stringify(payloadLocal, null, 2)}`);

      // 3. Verificaciones requeridas para el envío externo
      if (!this.protoRoot) {
        throw new Error('El esquema Protobuf no ha sido cargado. Imposible enviar a la API externa.');
      }

      // 4. Intentar obtener el token de seguridad
      const token = await this.authenticate();

      const AuditoriaRequestMessage = this.protoRoot.lookupType('AuditoriaRequest');
      
      // Asignar el token real al payload para su envío
      const payload = { ...payloadLocal, token };

      // Validar y serializar
      const errMsg = AuditoriaRequestMessage.verify(payload);
      if (errMsg) throw Error(errMsg);

      const message = AuditoriaRequestMessage.create(payload);
      const buffer = AuditoriaRequestMessage.encode(message).finish();

      // Enviar como application/x-protobuf
      const response = await firstValueFrom(
        this.httpService.post(this.auditoriaUrl, buffer, {
          headers: {
            'Content-Type': 'application/x-protobuf',
          },
        }),
      );
      
      this.logger.log(`Pista de auditoría centralizada enviada con éxito (Status: ${response.status})`);
      
    } catch (error) {
      this.logger.error('Error enviando la pista de auditoría:', error?.response?.data || error.message);
      // Fire-and-forget: No lanzamos el error para no bloquear la request del usuario original
    }
  }

  // Utilidad simple para generar un id numérico basado en el método HTTP (puedes ajustarla)
  private mapModuloToId(modulo: string, accion: string): number {
    if (accion.includes('GET')) return 1;
    if (accion.includes('POST')) return 2;
    if (accion.includes('PUT')) return 3;
    if (accion.includes('PATCH')) return 4;
    if (accion.includes('DELETE')) return 5;
    return 100;
  }
}
