import { Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { DestinationId } from '../providers/destination-id.enum';

export class GetDestinationContextParamsDto {
  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  @IsEnum(DestinationId)
  id: DestinationId;
}
