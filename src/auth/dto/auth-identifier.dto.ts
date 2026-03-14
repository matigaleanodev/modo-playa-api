import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AuthIdentifierDto {
  @ApiProperty({
    example: 'admin@modoplaya.com',
    description: 'Email o username del usuario',
    minLength: 3,
    maxLength: 120,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  identifier!: string;
}
