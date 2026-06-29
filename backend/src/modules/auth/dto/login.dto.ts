import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Nombre de usuario' })
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @ApiProperty({ example: 'clave123', description: 'Clave del usuario' })
  @IsString()
  @IsNotEmpty()
  clave: string;
}
