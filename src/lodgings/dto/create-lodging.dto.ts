import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityRangeDto } from './availability-range.dto';
import { LodgingAmenity } from '@lodgings/enums/amenities.enum';
import { PriceUnit } from '@lodgings/enums/price-unit.enum';
import { LodgingType } from '@lodgings/enums/lodging-type.enum';

export class CreateLodgingDto {
  @ApiProperty({ example: 'Cabaña Frente al Mar' })
  @IsString()
  title!: string;

  @ApiProperty({
    example:
      'Hermosa cabaña equipada para 6 personas a 200 metros de la playa.',
  })
  @IsString()
  description!: string;

  @ApiProperty({ example: 'Calle 34 entre Mar del Plata y Punta del Este' })
  @IsString()
  location!: string;

  @ApiProperty({ example: 'Mar Azul' })
  @IsString()
  city!: string;

  @ApiProperty({ enum: LodgingType, example: LodgingType.CABIN })
  @IsEnum(LodgingType)
  type!: LodgingType;

  @ApiProperty({ example: 85000 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ enum: PriceUnit, example: PriceUnit.NIGHT })
  @IsEnum(PriceUnit)
  priceUnit!: PriceUnit;

  @ApiProperty({ example: 6 })
  @IsNumber()
  @Min(1)
  maxGuests!: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0)
  bedrooms!: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0)
  bathrooms!: number;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(1)
  minNights!: number;

  @ApiPropertyOptional({
    example: 300,
    description: 'Distancia en metros a la playa',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  distanceToBeach?: number;

  @ApiPropertyOptional({
    enum: LodgingAmenity,
    isArray: true,
    example: ['wifi', 'parrilla', 'pool'],
  })
  @IsArray()
  @IsEnum(LodgingAmenity, { each: true })
  @IsOptional()
  amenities?: LodgingAmenity[];

  @ApiProperty({
    example: 'https://cdn.modo-playa.com/lodgings/cabana-1/main.jpg',
  })
  @IsUrl()
  mainImage!: string;

  @ApiPropertyOptional({
    type: [String],
    example: [
      'https://cdn.modo-playa.com/lodgings/cabana-1/1.jpg',
      'https://cdn.modo-playa.com/lodgings/cabana-1/2.jpg',
    ],
  })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({
    type: [AvailabilityRangeDto],
    example: [
      {
        from: '2026-01-10',
        to: '2026-01-20',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityRangeDto)
  @IsOptional()
  occupiedRanges?: AvailabilityRangeDto[];

  @ApiPropertyOptional({
    example: '665c1234abc123456789abcd',
  })
  @IsMongoId()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
