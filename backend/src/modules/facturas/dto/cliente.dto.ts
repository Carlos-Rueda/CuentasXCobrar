import { ApiProperty } from '@nestjs/swagger';

export class ClienteDto {
  @ApiProperty({ example: 'cli-001' })
  id: string;

  @ApiProperty({ example: 'Carlos Rueda' })
  nombre: string;

  @ApiProperty({ example: '1004123456001' })
  ruc: string;

  @ApiProperty({ example: 'carlos@mail.com' })
  correo: string;

  @ApiProperty({ example: '0999999999' })
  telefono: string;
}
