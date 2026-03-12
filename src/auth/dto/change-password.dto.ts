import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'PasswordActual123',
    description: 'Contrasena actual del usuario autenticado',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  currentPassword!: string;

  @ApiProperty({
    example: 'NuevaPassword456',
    description: 'Nueva contrasena del usuario autenticado',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}
