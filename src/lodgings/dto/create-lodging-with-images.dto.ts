import { OmitType } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { CreateLodgingDto } from './create-lodging.dto';

export class CreateLodgingWithImagesDto extends OmitType(CreateLodgingDto, [
  'mainImage',
  'images',
] as const) {
  @IsOptional()
  @IsUrl()
  mainImage?: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];
}

export class CreateLodgingMultipartBodyDto {
  @IsString()
  payload!: string;
}
