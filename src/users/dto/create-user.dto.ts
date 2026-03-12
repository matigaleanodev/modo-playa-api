import {
  IsEmail,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'admin@modoplaya.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'admin',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiPropertyOptional({
    example: '665c1234abc123456789abce',
    description:
      'Owner objetivo cuando un SUPERADMIN crea el usuario en nombre de otro tenant.',
  })
  @IsOptional()
  @IsMongoId()
  targetOwnerId?: string;
}
