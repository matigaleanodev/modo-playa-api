import { ApiProperty } from '@nestjs/swagger';
import { LodgingAmenity } from '@lodgings/enums/amenities.enum';
import { LodgingType } from '@lodgings/enums/lodging-type.enum';
import { PriceUnit } from '@lodgings/enums/price-unit.enum';

export class LodgingResponseDto {
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

  @ApiProperty({ required: false })
  distanceToBeach?: number;

  @ApiProperty({ enum: LodgingAmenity, isArray: true })
  amenities!: LodgingAmenity[];

  @ApiProperty()
  mainImage!: string;

  @ApiProperty({ type: [String] })
  images!: string[];
}
