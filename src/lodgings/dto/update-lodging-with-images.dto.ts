import { IsString } from 'class-validator';
import { UpdateLodgingDto } from './update-lodging.dto';

export class UpdateLodgingWithImagesDto extends UpdateLodgingDto {}

export class UpdateLodgingMultipartBodyDto {
  @IsString()
  payload!: string;
}
