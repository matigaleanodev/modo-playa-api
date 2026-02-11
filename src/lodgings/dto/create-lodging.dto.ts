import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LodgingType } from '../schemas/lodging.schema';
import { AvailabilityRangeDto } from './availability-range.dto';

export class CreateLodgingDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  location!: string;

  @IsEnum(LodgingType)
  type!: LodgingType;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsUrl()
  mainImage!: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityRangeDto)
  @IsOptional()
  occupiedRanges?: AvailabilityRangeDto[];

  @IsMongoId()
  @IsOptional()
  contactId?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
