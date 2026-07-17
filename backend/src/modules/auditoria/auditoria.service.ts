import { Injectable } from '@nestjs/common';
import axios from 'axios';
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
  async registrar(data: any) {
    try {
      await this.registrarPorAWS(data);

      console.log('✅ Auditoría registrada por AWS');
    } catch (error: any) {
      console.warn('⚠ AWS falló');

      if (error.response) {
        console.warn(error.response.status);
        console.warn(error.response.data);
      }

      console.warn('Intentando GraphQL...');

      try {
        const result = await this.registrarPorGraphQL(data);

        console.log('RESULTADO GRAPHQL:');
        console.log(result);

        console.log('✅ Auditoría registrada por GraphQL');
      } catch (errorGraphQL: any) {
        console.error('❌ También falló GraphQL');

        if (errorGraphQL.response) {
          console.error(errorGraphQL.response.data);
        }

        throw errorGraphQL;
      }
    }
  }
  private async registrarPorAWS(data: any) {
    const protoPath = path.resolve(
      process.cwd(),
      'src',
      'modules',
      'auditoria',
      'auditoria.proto',
    );

    console.log('PROTO PATH:', protoPath);

    const root = await protobuf.load(protoPath);
    const AuditoriaRequest = root.lookupType('AuditoriaRequest');

    const mensaje = AuditoriaRequest.create({
      token: data.token,
      id_funcion: data.idFuncion,
      accion: data.accion,
      descripcion: data.descripcion,
      observacion: data.observacion,
      ip_usuario: data.ip,
    });
    console.log(mensaje);

    const buffer = AuditoriaRequest.encode(mensaje).finish();

    return axios.post(
      'https://98l52rpey8.execute-api.us-east-1.amazonaws.com/default/api-pistas-auditoria',
      buffer,
      {
        headers: {
          'Content-Type': 'application/x-protobuf',
        },
      },
    );
  }
  // Solo para evitar errores del interceptor.
  // No será utilizado.
  async registrarTraza(data: TrazaData, tokenJwt?: string): Promise<void> {
    console.log('registrarTraza (NO UTILIZADO)');
    console.log(data);
    console.log(tokenJwt);
  }
  private async registrarPorGraphQL(data: any) {
    const url =
      process.env.SECURITY_GRAPHQL_URL ||
      'https://proyecto-moduloseguridad.onrender.com/graphql/';

    const mutation = `
    mutation {
      createAuditLog(
        token: "${data.token}"
        idFuncion: ${data.idFuncion}
        accion: "${data.accion}"
        descripcion: "${data.descripcion}"
        observacion: ""
        ipUsuario: "${data.ip}"
      ) {
        success
        message
      }
    }
  `;

    const response = await axios.post(
      url,
      {
        query: mutation,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );

    console.log('========== RESPUESTA GRAPHQL ==========');
    console.log(response.data);
    console.log('=======================================');

    const resultado = response.data?.data?.createAuditLog;

    if (!resultado) {
      throw new Error('GraphQL no devolvió createAuditLog');
    }

    if (!resultado.success) {
      throw new Error(resultado.message);
    }

    return resultado;
  }
}
