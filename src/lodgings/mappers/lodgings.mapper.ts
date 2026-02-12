import { LodgingDocument } from '../schemas/lodging.schema';
import { LodgingResponseDto } from '../dto/lodging-response.dto';

export class LodgingMapper {
  static toResponse(lodging: LodgingDocument): LodgingResponseDto {
    return {
      id: lodging._id.toString(),
      title: lodging.title,
      description: lodging.description,
      location: lodging.location,
      city: lodging.city,
      type: lodging.type,
      price: lodging.price,
      priceUnit: lodging.priceUnit,
      maxGuests: lodging.maxGuests,
      bedrooms: lodging.bedrooms,
      bathrooms: lodging.bathrooms,
      minNights: lodging.minNights,
      distanceToBeach: lodging.distanceToBeach,
      amenities: lodging.amenities,
      mainImage: lodging.mainImage,
      images: lodging.images,
    };
  }
}
