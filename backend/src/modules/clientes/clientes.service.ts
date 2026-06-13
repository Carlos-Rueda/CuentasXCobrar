import { Injectable } from '@nestjs/common';
import { ClienteEntity } from './cliente.entity';

@Injectable()
export class ClientesService {
  private clientes: ClienteEntity[] = [];
}
