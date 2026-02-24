import { ApiProperty } from '@nestjs/swagger';
import { LodgingImageResponseDto } from './lodging-image-response.dto';

export class SetDefaultLodgingImageResponseDto {
  @ApiProperty({ type: [LodgingImageResponseDto] })
  images!: LodgingImageResponseDto[];
}
