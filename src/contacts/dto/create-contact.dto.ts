import {
  IsBoolean,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({
    example: 'Inmobiliaria Gómez',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    example: 'contacto@inmobiliariagomez.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '+5492255123456',
    description: 'Número con código país sin espacios',
  })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Indica si es el contacto principal por defecto',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: 'Disponible de 9 a 18 hs. Responde rápido por WhatsApp.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: '665c1234abc123456789abce',
    description:
      'Owner objetivo cuando un SUPERADMIN crea el contacto en nombre de otro tenant.',
  })
  @IsOptional()
  @IsMongoId()
  targetOwnerId?: string;
}
