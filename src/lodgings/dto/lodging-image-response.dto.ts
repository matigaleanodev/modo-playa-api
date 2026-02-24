import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LodgingImageVariantsResponseDto {
  @ApiProperty()
  thumb!: string;

  @ApiProperty()
  card!: string;

  @ApiProperty()
  hero!: string;
}

export class LodgingImageResponseDto {
  @ApiProperty()
  imageId!: string;

  @ApiProperty()
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

  @ApiProperty()
  url!: string;

  @ApiPropertyOptional({ type: LodgingImageVariantsResponseDto })
  variants?: LodgingImageVariantsResponseDto;
}
