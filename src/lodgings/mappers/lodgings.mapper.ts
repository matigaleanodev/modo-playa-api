import { LodgingDocument } from '../schemas/lodging.schema';
import { LodgingResponseDto } from '../dto/lodging-response.dto';
import { LodgingImageResponseDto } from '@lodgings/dto/lodging-image-response.dto';
import type { MediaUrlBuilder } from '@media/interfaces/media-url-builder.interface';
import { ContactResponseDto } from '@contacts/dto/contact-response.dto';

export class LodgingMapper {
  static toResponse(
    lodging: LodgingDocument,
    mediaUrlBuilder?: MediaUrlBuilder,
  ): LodgingResponseDto {
    const { contactId, contact } = LodgingMapper.toContactResponse(lodging);
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
      contactId,
      contact,
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

  private static toContactResponse(lodging: LodgingDocument): {
    contactId?: string;
    contact?: ContactResponseDto;
  } {
    const rawContact = lodging.contactId as unknown;

    if (!rawContact) {
      return {};
    }

    if (typeof rawContact === 'string') {
      return { contactId: rawContact };
    }

    const asObj = rawContact as {
      toString?: () => string;
      _id?: { toString?: () => string } | string;
      name?: string;
      email?: string;
      whatsapp?: string;
      isDefault?: boolean;
      active?: boolean;
      notes?: string;
    };

    const idFromNested =
      typeof asObj._id === 'string'
        ? asObj._id
        : asObj._id?.toString?.();
    const id = idFromNested ?? asObj.toString?.();

    if (!id) {
      return {};
    }

    if (!asObj.name) {
      return { contactId: id };
    }

    return {
      contactId: id,
      contact: {
        id,
        name: asObj.name,
        email: asObj.email,
        whatsapp: asObj.whatsapp,
        isDefault: !!asObj.isDefault,
        active: asObj.active ?? true,
        notes: asObj.notes,
      },
    };
  }
}
