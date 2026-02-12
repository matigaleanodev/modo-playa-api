import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
