import { LodgingDocument } from '../schemas/lodging.schema';
import { LodgingResponseDto } from '../dto/lodging-response.dto';
import { LodgingImageResponseDto } from '@lodgings/dto/lodging-image-response.dto';

export class LodgingMapper {
  static toResponse(lodging: LodgingDocument): LodgingResponseDto {
    const mediaImages = Array.isArray(lodging.mediaImages)
      ? lodging.mediaImages.map<LodgingImageResponseDto>((image) => ({
          imageId: image.imageId,
          key: image.key,
          isDefault: image.isDefault,
          width: image.width,
          height: image.height,
          bytes: image.bytes,
          mime: image.mime,
          createdAt: new Date(image.createdAt).toISOString(),
          url: image.key,
        }))
      : undefined;

    const derivedMainImage =
      mediaImages?.find((image) => image.isDefault)?.url ?? lodging.mainImage;

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
      mainImage: derivedMainImage,
      images: lodging.images,
      mediaImages,
    };
  }
}
