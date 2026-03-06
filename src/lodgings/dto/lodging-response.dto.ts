import { ApiProperty } from '@nestjs/swagger';
import { LodgingAmenity } from '@lodgings/enums/amenities.enum';
import { LodgingType } from '@lodgings/enums/lodging-type.enum';
import { PriceUnit } from '@lodgings/enums/price-unit.enum';
import { LodgingImageResponseDto } from './lodging-image-response.dto';
import { ContactResponseDto } from '@contacts/dto/contact-response.dto';
import { AvailabilityRangeDto } from './availability-range.dto';

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

  @ApiProperty({
    description:
      'URL pública completa de la imagen principal expuesta al frontend.',
    example:
      'https://media.example.com/lodgings/699c9b30436edbee481101be/244e45ae-bdb3-407b-adf2-ade015e1a5ef/original.webp',
  })
  mainImage!: string;

  @ApiProperty({
    type: [String],
    description:
      'URLs públicas completas de imágenes legacy expuestas al frontend.',
    example: [
      'https://media.example.com/lodgings/699c9b30436edbee481101be/244e45ae-bdb3-407b-adf2-ade015e1a5ef/original.webp',
    ],
  })
  images!: string[];

  @ApiProperty({
    type: [LodgingImageResponseDto],
    required: false,
    description:
      'Metadata de imágenes procesadas. `url` y `variants.*` son URLs públicas; `key` permanece como referencia interna.',
  })
  mediaImages?: LodgingImageResponseDto[];

  @ApiProperty({
    type: [AvailabilityRangeDto],
    required: false,
    description:
      'Rangos ocupados normalizados en formato YYYY-MM-DD para consumo del frontend.',
  })
  occupiedRanges?: AvailabilityRangeDto[];

  @ApiProperty({
    required: false,
    description: 'ID del contacto asociado al alojamiento.',
    example: '699c9b30436edbee48110155',
  })
  contactId?: string;

  @ApiProperty({
    required: false,
    type: ContactResponseDto,
    description: 'Datos del contacto asociado cuando está disponible.',
  })
  contact?: ContactResponseDto;
}
