import { ApiProperty } from '@nestjs/swagger';
import { LodgingImageResponseDto } from './lodging-image-response.dto';

export class DeleteLodgingImageResponseDto {
  @ApiProperty()
  deleted!: boolean;

  @ApiProperty({ type: [LodgingImageResponseDto] })
  images!: LodgingImageResponseDto[];
}
