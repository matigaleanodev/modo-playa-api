import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LodgingAmenity } from '@lodgings/enums/amenities.enum';
import { LodgingType } from '@lodgings/enums/lodging-type.enum';
import { PriceUnit } from '@lodgings/enums/price-unit.enum';
import { AvailabilityRangeDto } from './availability-range.dto';

class PublicLodgingImageVariantsResponseDto {
  @ApiProperty()
  thumb!: string;

  @ApiProperty()
  card!: string;

  @ApiProperty()
  hero!: string;
}

export class PublicLodgingImageResponseDto {
  @ApiProperty()
  imageId!: string;

  @ApiProperty()
  isDefault!: boolean;

  @ApiPropertyOptional()
  width?: number;

  @ApiPropertyOptional()
  height?: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  url!: string;

  @ApiPropertyOptional({ type: PublicLodgingImageVariantsResponseDto })
  variants?: PublicLodgingImageVariantsResponseDto;
}

export class PublicLodgingContactResponseDto {
  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  whatsapp?: string;
}

export class PublicLodgingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  location!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty({ enum: LodgingType })
  type!: LodgingType;

  @ApiProperty()
  price!: number;

  @ApiProperty({ enum: PriceUnit })
  priceUnit!: PriceUnit;

  @ApiProperty()
  maxGuests!: number;

  @ApiProperty()
  bedrooms!: number;

  @ApiProperty()
  bathrooms!: number;

  @ApiProperty()
  minNights!: number;

  @ApiPropertyOptional()
  distanceToBeach?: number;

  @ApiProperty({ enum: LodgingAmenity, isArray: true })
  amenities!: LodgingAmenity[];

  @ApiProperty()
  mainImage!: string;

  @ApiProperty({ type: [String] })
  images!: string[];

  @ApiPropertyOptional({
    type: [PublicLodgingImageResponseDto],
  })
  mediaImages?: PublicLodgingImageResponseDto[];

  @ApiPropertyOptional({
    type: [AvailabilityRangeDto],
  })
  occupiedRanges?: AvailabilityRangeDto[];

  @ApiPropertyOptional({
    type: PublicLodgingContactResponseDto,
  })
  contact?: PublicLodgingContactResponseDto;
}
