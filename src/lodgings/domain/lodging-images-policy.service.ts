import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '@common/constants/error-code';
import { DomainException } from '@common/exceptions/domain.exception';
import { LodgingImage } from '@lodgings/schemas/lodging-image.schema';
import { PendingLodgingImageUpload } from '@lodgings/schemas/pending-lodging-image-upload.schema';

@Injectable()
export class LodgingImagesPolicyService {
  readonly MAX_IMAGES = 5;

  assertCanReserveSlot(imagesCount: number, pendingCount: number): void {
    if (imagesCount + pendingCount >= this.MAX_IMAGES) {
      throw new DomainException(
        'Lodging image limit exceeded',
        ERROR_CODES.LODGING_IMAGE_LIMIT_EXCEEDED,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  assertPendingUploadValid(
    pending: PendingLodgingImageUpload | undefined,
    expectedKey: string,
    now: Date,
  ): void {
    if (!pending) {
      throw new DomainException(
        'Pending lodging image upload not found',
        ERROR_CODES.LODGING_IMAGE_PENDING_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (pending.stagingKey !== expectedKey) {
      throw new DomainException(
        'Invalid lodging image upload key',
        ERROR_CODES.LODGING_IMAGE_UPLOAD_INVALID_KEY,
        HttpStatus.BAD_REQUEST,
      );
    }

    const expiresAt = new Date(pending.expiresAt);

    if (Number.isNaN(expiresAt.getTime())) {
      throw new DomainException(
        'Pending lodging image upload has invalid expiration date',
        ERROR_CODES.LODGING_IMAGE_INVALID_STATE,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (expiresAt.getTime() < now.getTime()) {
      throw new DomainException(
        'Pending lodging image upload expired',
        ERROR_CODES.LODGING_IMAGE_PENDING_EXPIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  assertValidImagesState(images: LodgingImage[]): void {
    if (images.length > this.MAX_IMAGES) {
      throw new DomainException(
        'Lodging image limit exceeded',
        ERROR_CODES.LODGING_IMAGE_LIMIT_EXCEEDED,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (images.length === 0) {
      return;
    }

    const defaultCount = images.filter((image) => image.isDefault).length;

    if (defaultCount !== 1) {
      throw new DomainException(
        'Invalid lodging images default state',
        ERROR_CODES.LODGING_IMAGE_INVALID_DEFAULT_STATE,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
