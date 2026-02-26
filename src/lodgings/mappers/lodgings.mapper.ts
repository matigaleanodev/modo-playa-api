import { LodgingDocument } from '../schemas/lodging.schema';
import { LodgingResponseDto } from '../dto/lodging-response.dto';
import { LodgingImageResponseDto } from '@lodgings/dto/lodging-image-response.dto';
import type { MediaUrlBuilder } from '@media/interfaces/media-url-builder.interface';

export class LodgingMapper {
  static toResponse(
    lodging: LodgingDocument,
    mediaUrlBuilder?: MediaUrlBuilder,
  ): LodgingResponseDto {
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
          url: mediaUrlBuilder
            ? mediaUrlBuilder.buildPublicUrl(image.key)
            : image.key,
          variants: mediaUrlBuilder
            ? mediaUrlBuilder.buildLodgingVariants(image.key)
            : undefined,
        }))
      : undefined;

    const derivedMainImage =
      mediaImages?.find((image) => image.isDefault)?.url ??
      LodgingMapper.toPublicUrl(lodging.mainImage, mediaUrlBuilder);

    const normalizedImages = Array.isArray(lodging.images)
      ? lodging.images
          .map((image) => LodgingMapper.toPublicUrl(image, mediaUrlBuilder))
          .filter((image): image is string => Boolean(image))
      : [];

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
      mainImage: derivedMainImage ?? '',
      images: normalizedImages,
      mediaImages,
    };
  }

  private static toPublicUrl(
    value: string | undefined,
    mediaUrlBuilder?: MediaUrlBuilder,
  ): string | undefined {
    if (!value) {
      return value;
    }

    return mediaUrlBuilder ? mediaUrlBuilder.buildPublicUrl(value) : value;
  }
}
