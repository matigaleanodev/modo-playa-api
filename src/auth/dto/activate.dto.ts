import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { IdentifierDto } from './identifier.dto';

export class ActivateDto extends IdentifierDto {
  @ApiProperty({
    example: '123456',
    description: 'Código de activación enviado por email',
  })
  @IsString()
  @Length(6, 6)
  code!: string;
}
