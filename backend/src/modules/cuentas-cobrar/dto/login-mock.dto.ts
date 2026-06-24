import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginMockDto {
  @ApiProperty({ example: 'admin', description: 'Nombre de usuario' })
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @ApiProperty({ example: 'admin123', description: 'Contraseña de usuario' })
  @IsString()
  @IsNotEmpty()
  contrasena: string;
}
