import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin@modoplaya.com',
    description: 'Email o username del usuario',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  identifier!: string;

  @ApiProperty({
    example: 'Password123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
