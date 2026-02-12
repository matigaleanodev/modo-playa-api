import { IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyResetCodeDto {
  @ApiProperty({
    example: 'admin@modoplaya.com',
    description: 'Email o username del usuario',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  identifier!: string;

  @ApiProperty({
    example: '123456',
    description: 'Código de verificación de 6 dígitos enviado por email',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  code!: string;
}
