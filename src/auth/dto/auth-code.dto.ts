import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class AuthCodeDto {
  @ApiProperty({
    example: '123456',
    description: 'Codigo de verificacion de 6 digitos enviado por email',
    pattern: '^\\d{6}$',
  })
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}
