import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LodgingImageVariantsResponseDto {
  @ApiProperty({
    example:
      'https://media.example.com/cdn-cgi/image/width=320,height=240,fit=cover,quality=80,format=auto/lodgings/abc/original.webp',
    description: 'URL pública completa de la variante thumb.',
  })
  thumb!: string;

  @ApiProperty({
    example:
      'https://media.example.com/cdn-cgi/image/width=640,height=420,fit=cover,quality=82,format=auto/lodgings/abc/original.webp',
    description: 'URL pública completa de la variante card.',
  })
  card!: string;

  @ApiProperty({
    example:
      'https://media.example.com/cdn-cgi/image/width=1600,height=900,fit=cover,quality=85,format=auto/lodgings/abc/original.webp',
    description: 'URL pública completa de la variante hero.',
  })
  hero!: string;
}

export class LodgingImageResponseDto {
  @ApiProperty()
  imageId!: string;

  @ApiProperty({
    example:
      'lodgings/699c9b30436edbee481101be/244e45ae-bdb3-407b-adf2-ade015e1a5ef/original.webp',
    description:
      'Key interna en storage (R2). Se conserva para uso interno/administración.',
  })
  key!: string;

  @ApiProperty()
  isDefault!: boolean;

  @ApiPropertyOptional()
  width?: number;

  @ApiPropertyOptional()
  height?: number;

  @ApiPropertyOptional()
  bytes?: number;

  @ApiPropertyOptional()
  mime?: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({
    example:
      'https://media.example.com/lodgings/699c9b30436edbee481101be/244e45ae-bdb3-407b-adf2-ade015e1a5ef/original.webp',
    description: 'URL pública completa lista para usar en el frontend.',
  })
  url!: string;

  @ApiPropertyOptional({
    type: LodgingImageVariantsResponseDto,
    description:
      'Variantes públicas derivadas de la imagen original (URLs completas).',
  })
  variants?: LodgingImageVariantsResponseDto;
}
