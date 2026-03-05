import { ApiProperty } from '@nestjs/swagger';
import { DestinationId } from '../providers/destination-id.enum';

export class DestinationResponseDto {
  @ApiProperty({
    enum: DestinationId,
    example: DestinationId.PAMPAS,
  })
  id: DestinationId;

  @ApiProperty({
    example: 'Mar de las Pampas',
  })
  name: string;
}
