import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as protobuf from 'protobufjs';
import * as path from 'path';
import * as fs from 'fs';

export interface TrazaData {
  usuario_id: string;
  accion: string;
  modulo: string;
  ip_origen: string;
  marca_tiempo: string;
  detalles: string;
}

@Injectable()
export class AuditoriaService implements OnModuleInit {
  private readonly logger = new Logger(AuditoriaService.name);
  private readonly authUrl = 'https://712286fsib.execute-api.us-east-1.amazonaws.com/default/api-auth-central';
  
  private jwtToken: string = '';
  private tokenExpiresAt: number = 0;
  
  private protoRoot: protobuf.Root | null = null;

  constructor(private readonly httpService: HttpService) {}

  onModuleInit() {
    try {
      let protoPath = path.resolve(__dirname, 'auditoria.proto');
      
      if (!fs.existsSync(protoPath)) {
        protoPath = path.resolve(__dirname, '..', '..', 'auditoria', 'proto', 'auditoria.proto');
        if (!fs.existsSync(protoPath)) {
          protoPath = path.resolve(process.cwd(), 'src', 'auditoria', 'proto', 'auditoria.proto');
          if (!fs.existsSync(protoPath)) {
            protoPath = path.resolve(process.cwd(), 'dist', 'src', 'auditoria', 'proto', 'auditoria.proto');
          }
        }
      }

      this.protoRoot = protobuf.loadSync(protoPath);
      this.logger.log(`Archivo Protobuf de auditoría cargado correctamente (Sync) desde: ${protoPath}`);
    } catch (error) {
      this.logger.error('Error cargando el archivo auditoria.proto de forma síncrona', error.message);
    }
  }

  private async authenticate(): Promise<string> {
    const now = Date.now();
    if (this.jwtToken && this.tokenExpiresAt > now + 5 * 60 * 1000) {
      return this.jwtToken;
    }

    try {
      const payload = {
        api_key: process.env.MODULE_API_KEY || 'dev_key_cxc_111',
        usuario: 'HenryMoreta',
        clave: 'Elvolver2026*',
        ip: '127.0.0.1',
      };

      const response = await firstValueFrom(
        this.httpService.post(this.authUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      if (response.data?.success && response.data?.token) {
        this.jwtToken = response.data.token;
        this.tokenExpiresAt = now + 8 * 60 * 60 * 1000; 
        this.logger.log('Autenticación con el Módulo de Seguridad para Auditoría exitosa.');
        return this.jwtToken;
      } else {
        throw new Error('Respuesta de autenticación inválida para auditoría');
      }
    } catch (error: any) {
      this.logger.error('Falló la autenticación para auditoría', error?.response?.data || error.message);
      throw error;
    }
  }

  public async registrarTraza(data: TrazaData, tokenJwt: string): Promise<void> {
    try {
      if (!tokenJwt || tokenJwt.trim() === "") {
        this.logger.warn("Token JWT no provisto. Se omite el envío de la pista de auditoría.");
        return;
      }

      const idFuncionVal = this.mapModuloToId(data.modulo, data.accion);
      const ipVal = data.ip_origen || '127.0.0.1';

      // Nota: protobufjs utiliza camelCase internamente para las propiedades de JS.
      // Definimos tanto las propiedades camelCase como las snake_case para asegurar compatibilidad total en la serialización.
      const payloadLocal = {
        token: tokenJwt,
        id_funcion: idFuncionVal,
        idFuncion: idFuncionVal,
        accion: data.accion, 
        descripcion: `Acción en módulo ${data.modulo}`, 
        observacion: data.detalles || '', 
        ip_usuario: ipVal,
        ipUsuario: ipVal,
      };

      this.logger.log(`Registrando Pista de Auditoría (Local): \n${JSON.stringify(payloadLocal, null, 2)}`);
      
      console.log('\n================================================================================');
      console.log('📢 PISTA DE AUDITORÍA DETECTADA Y REGISTRADA:');
      console.log(JSON.stringify(payloadLocal, null, 2));
      console.log('================================================================================\n');

      if (!this.protoRoot) {
        throw new Error('El esquema Protobuf no ha sido cargado.');
      }

      const AuditoriaRequest = this.protoRoot.lookupType('AuditoriaRequest');
      
      const peticion: any = AuditoriaRequest.create({
        token: tokenJwt,
        id_funcion: idFuncionVal,
        idFuncion: idFuncionVal,
        accion: data.accion, 
        descripcion: `Acción en módulo ${data.modulo}`, 
        observacion: data.detalles || '', 
        ip_usuario: ipVal,
        ipUsuario: ipVal,
      });

      peticion.token = tokenJwt;

      const errMsg = AuditoriaRequest.verify(peticion);
      if (errMsg) {
        throw new Error(errMsg);
      }

      const buffer = Buffer.from(AuditoriaRequest.encode(peticion).finish());

      const auditoriaUrl = process.env.AUDITORIA_API_URL || 'https://98l52rpey8.execute-api.us-east-1.amazonaws.com/default/api-pistas-auditoria';

      const response = await firstValueFrom(
        this.httpService.post(auditoriaUrl, buffer, {
          headers: {
            'Content-Type': 'application/x-protobuf',
          },
          responseType: 'arraybuffer',
        }),
      );
      
      this.logger.log(`Pista de auditoría centralizada enviada con éxito (Status: ${response.status})`);
      
    } catch (error: any) {
      let errorMsg = error.message;
      if (error.response && error.response.data) {
        if (Buffer.isBuffer(error.response.data)) {
          errorMsg = error.response.data.toString('utf-8');
        } else if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        } else {
          errorMsg = JSON.stringify(error.response.data);
        }
      }
      console.error('Error enviando la pista de auditoría centralizada:', errorMsg);
      // Fire and forget: no lanzamos throw para no bloquear transacciones
    }
  }

  private mapModuloToId(modulo: string, accion: string): number {
    if (accion.includes('GET')) return 1;
    if (accion.includes('POST')) return 2;
    if (accion.includes('PUT')) return 3;
    if (accion.includes('PATCH')) return 4;
    if (accion.includes('DELETE')) return 5;
    return 100;
  }
}



