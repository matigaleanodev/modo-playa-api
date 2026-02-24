import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LodgingImageResponseDto } from './lodging-image-response.dto';

export class ConfirmLodgingImageResponseDto {
  @ApiProperty({ type: LodgingImageResponseDto })
  image!: LodgingImageResponseDto;

  @ApiPropertyOptional()
  idempotent?: boolean;
}
