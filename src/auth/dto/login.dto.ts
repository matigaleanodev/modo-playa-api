import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuthIdentifierDto } from './auth-identifier.dto';
import { PasswordDto } from './password.dto';

export class LoginDto extends AuthIdentifierDto {
  @ApiProperty({
    example: 'Password123',
    description: 'Contrasena del usuario',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: PasswordDto['password'];
}
