import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { PassThrough } from 'stream';
import { pipeline } from 'stream/promises';
import { UserRole } from '@common/interfaces/role.interface';
import { toObjectIdOrThrow } from '@common/utils/object-id.util';
import { ERROR_CODES } from '@common/constants/error-code';
import { DomainException } from '@common/exceptions/domain.exception';
import { Lodging, LodgingDocument } from '@lodgings/schemas/lodging.schema';
import { RequestLodgingImageUploadUrlDto } from '@lodgings/dto/request-lodging-image-upload-url.dto';
import { LodgingImageUploadUrlResponseDto } from '@lodgings/dto/lodging-image-upload-url-response.dto';
import { ConfirmLodgingImageDto } from '@lodgings/dto/confirm-lodging-image.dto';
import { ConfirmLodgingImageResponseDto } from '@lodgings/dto/confirm-lodging-image-response.dto';
import { SetDefaultLodgingImageResponseDto } from '@lodgings/dto/set-default-lodging-image-response.dto';
import { DeleteLodgingImageResponseDto } from '@lodgings/dto/delete-lodging-image-response.dto';
import { LodgingImagesPolicyService } from '@lodgings/domain/lodging-images-policy.service';
import {
  IMAGE_PROCESSOR_SERVICE,
  MEDIA_URL_BUILDER,
  OBJECT_STORAGE_SERVICE,
} from '@media/constants/media.tokens';
import type { ImageProcessorService } from '@media/interfaces/image-processor.interface';
import type { ObjectStorageService } from '@media/interfaces/object-storage.service.interface';
import type { MediaUrlBuilder } from '@media/interfaces/media-url-builder.interface';
import { LodgingImage } from '@lodgings/schemas/lodging-image.schema';
import { PendingLodgingImageUpload } from '@lodgings/schemas/pending-lodging-image-upload.schema';
import { LodgingImageResponseDto } from '@lodgings/dto/lodging-image-response.dto';
import { RequestDraftLodgingImageUploadUrlDto } from '@lodgings/dto/request-draft-lodging-image-upload-url.dto';
import {
  PendingLodgingDraftImageUpload,
  PendingLodgingDraftImageUploadDocument,
} from '@lodgings/schemas/pending-lodging-draft-image-upload.schema';
import { ConfirmDraftLodgingImageDto } from '@lodgings/dto/confirm-draft-lodging-image.dto';
import { ConfirmDraftLodgingImageResponseDto } from '@lodgings/dto/confirm-draft-lodging-image-response.dto';

@Injectable()
export class LodgingImagesService {
  constructor(
    @InjectModel(Lodging.name)
    private readonly lodgingModel: Model<LodgingDocument>,
    @InjectModel(PendingLodgingDraftImageUpload.name)
    private readonly pendingDraftUploadModel: Model<PendingLodgingDraftImageUploadDocument>,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly storage: ObjectStorageService,
    @Inject(IMAGE_PROCESSOR_SERVICE)
    private readonly imageProcessor: ImageProcessorService,
    @Inject(MEDIA_URL_BUILDER)
    private readonly mediaUrlBuilder: MediaUrlBuilder,
    private readonly configService: ConfigService,
    private readonly policy: LodgingImagesPolicyService,
  ) {}

  async createDraftUploadUrl(
    dto: RequestDraftLodgingImageUploadUrlDto,
    ownerId: string,
  ): Promise<LodgingImageUploadUrlResponseDto> {
    this.assertAllowedMime(dto.mime);
    this.assertSizeWithinLimit(dto.size, this.getLodgingMaxBytes());

    const ownerObjectId = toObjectIdOrThrow(ownerId, {
      message: 'Invalid owner id',
      errorCode: ERROR_CODES.INVALID_OBJECT_ID,
      httpStatus: HttpStatus.BAD_REQUEST,
    });

    await this.cleanupExpiredDraftUploads(ownerObjectId, dto.uploadSessionId);

    const pendingCount = await this.pendingDraftUploadModel.countDocuments({
      ownerId: ownerObjectId,
      uploadSessionId: dto.uploadSessionId,
    });
    this.policy.assertCanReserveSlot(0, pendingCount);

    const imageId = randomUUID();
    const ttlSeconds = this.getPendingUploadTtlSeconds();
    const stagingKey = this.buildDraftStagingKey(
      ownerId,
      dto.uploadSessionId,
      imageId,
    );

    await this.pendingDraftUploadModel.create({
      ownerId: ownerObjectId,
      uploadSessionId: dto.uploadSessionId,
      imageId,
      stagingKey,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      status: 'PENDING',
    });

    const signed = await this.storage.createSignedPutUrl({
      key: stagingKey,
      contentType: dto.mime,
      contentLength: dto.size,
    });

    return {
      imageId,
      uploadKey: stagingKey,
      uploadUrl: signed.url,
      method: signed.method,
      requiredHeaders: signed.requiredHeaders,
      expiresInSeconds: signed.expiresInSeconds,
    };
  }

  async confirmDraftUpload(
    dto: ConfirmDraftLodgingImageDto,
    ownerId: string,
  ): Promise<ConfirmDraftLodgingImageResponseDto> {
    const pending = await this.findPendingDraftUploadOrThrow(
      ownerId,
      dto.uploadSessionId,
      dto.imageId,
    );

    if (pending.status === 'CONFIRMED') {
      return {
        imageId: pending.imageId,
        uploadSessionId: pending.uploadSessionId,
        confirmed: true,
        idempotent: true,
      };
    }

    if (new Date(pending.expiresAt).getTime() < Date.now()) {
      await this.deleteDraftUploads([pending]);
      throw new DomainException(
        'Pending lodging draft image upload expired',
        ERROR_CODES.LODGING_IMAGE_PENDING_EXPIRED,
        HttpStatus.BAD_REQUEST,
      );
    }

    this.policy.assertPendingUploadValid(
      {
        imageId: pending.imageId,
        stagingKey: pending.stagingKey,
        createdAt: pending.createdAt,
        expiresAt: pending.expiresAt,
        status: 'PENDING',
      },
      pending.stagingKey,
      new Date(),
    );

    const stagingHead = await this.storage.headObject(pending.stagingKey);
    if (!stagingHead.exists) {
      throw new DomainException(
        'Pending draft lodging image upload not found in storage',
        ERROR_CODES.STORAGE_OBJECT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertAllowedMime(stagingHead.mime ?? undefined);
    this.assertSizeWithinLimit(stagingHead.bytes, this.getLodgingMaxBytes());

    pending.status = 'CONFIRMED';
    await pending.save();

    return {
      imageId: pending.imageId,
      uploadSessionId: pending.uploadSessionId,
      confirmed: true,
    };
  }

  async createUploadUrl(
    lodgingId: string,
    dto: RequestLodgingImageUploadUrlDto,
    ownerId: string,
    role: UserRole,
  ): Promise<LodgingImageUploadUrlResponseDto> {
    this.assertAllowedMime(dto.mime);
    this.assertSizeWithinLimit(dto.size, this.getLodgingMaxBytes());

    const lodging = await this.findOwnedLodgingOrThrow(
      lodgingId,
      ownerId,
      role,
    );
    await this.cleanupExpiredLodgingPendingUploads(lodging);

    const imageId = randomUUID();
    const stagingKey = this.buildStagingKey(lodgingId, imageId);
    const now = new Date();
    const ttlSeconds = this.getPendingUploadTtlSeconds();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    const reserveFilter = {
      ...this.buildOwnershipFilters(lodgingId, ownerId, role),
      $expr: {
        $lt: [
          {
            $add: [
              { $size: { $ifNull: ['$mediaImages', []] } },
              { $size: { $ifNull: ['$pendingImageUploads', []] } },
            ],
          },
          this.policy.MAX_IMAGES,
        ],
      },
    } as unknown as QueryFilter<LodgingDocument>;

    const updated = await this.lodgingModel.findOneAndUpdate(
      reserveFilter,
      {
        $push: {
          pendingImageUploads: {
            imageId,
            stagingKey,
            createdAt: now,
            expiresAt,
            status: 'PENDING',
          },
        },
      },
      { returnDocument: 'after' },
    );

    if (!updated) {
      const current = await this.findOwnedLodgingOrThrow(
        lodgingId,
        ownerId,
        role,
      );
      this.policy.assertCanReserveSlot(
        current.mediaImages.length,
        current.pendingImageUploads.length,
      );

      throw new DomainException(
        'No se pudo reservar el cupo para la imagen',
        ERROR_CODES.LODGING_IMAGE_INVALID_STATE,
        HttpStatus.CONFLICT,
      );
    }

    const signed = await this.storage.createSignedPutUrl({
      key: stagingKey,
      contentType: dto.mime,
      contentLength: dto.size,
    });

    return {
      imageId,
      uploadKey: stagingKey,
      uploadUrl: signed.url,
      method: signed.method,
      requiredHeaders: signed.requiredHeaders,
      expiresInSeconds: signed.expiresInSeconds,
    };
  }

  async confirmUpload(
    lodgingId: string,
    dto: ConfirmLodgingImageDto,
    ownerId: string,
    role: UserRole,
  ): Promise<ConfirmLodgingImageResponseDto> {
    const lodging = await this.findOwnedLodgingOrThrow(
      lodgingId,
      ownerId,
      role,
    );
    const existing = this.getLodgingImages(lodging).find(
      (image) => image.imageId === dto.imageId,
    );

    if (existing) {
      return {
        image: this.toLodgingImageResponse(existing),
        idempotent: true,
      };
    }

    const expectedStagingKey = this.buildStagingKey(lodgingId, dto.imageId);
    if (dto.key !== expectedStagingKey) {
      throw new DomainException(
        'Invalid lodging image upload key',
        ERROR_CODES.LODGING_IMAGE_UPLOAD_INVALID_KEY,
        HttpStatus.BAD_REQUEST,
      );
    }

    const removedExpiredIds =
      await this.cleanupExpiredLodgingPendingUploads(lodging);
    if (removedExpiredIds.has(dto.imageId)) {
      throw new DomainException(
        'Pending lodging image upload expired',
        ERROR_CODES.LODGING_IMAGE_PENDING_EXPIRED,
        HttpStatus.BAD_REQUEST,
      );
    }

    const pending = this.getPendingUploads(lodging).find(
      (item) => item.imageId === dto.imageId,
    );
    this.policy.assertPendingUploadValid(
      pending,
      expectedStagingKey,
      new Date(),
    );

    const stagingHead = await this.storage.headObject(expectedStagingKey);
    if (!stagingHead.exists) {
      throw new DomainException(
        'Pending upload object not found in storage',
        ERROR_CODES.STORAGE_OBJECT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertAllowedMime(stagingHead.mime ?? undefined);
    this.assertSizeWithinLimit(stagingHead.bytes, this.getLodgingMaxBytes());

    const finalKey = this.buildFinalKey(lodgingId, dto.imageId);
    const finalHead = await this.storage.headObject(finalKey);

    let processed = {
      width: dto.width,
      height: dto.height,
      bytes: finalHead.bytes ?? stagingHead.bytes,
      mime: finalHead.mime ?? 'image/webp',
    };

    if (!finalHead.exists) {
      const source = await this.storage.getObjectStream(expectedStagingKey);
      const handle = this.imageProcessor.createLodgingNormalizerTransform({
        maxWidth: this.getLodgingMaxWidth(),
        maxHeight: this.getLodgingMaxHeight(),
        outputFormat: 'webp',
      });
      const output = new PassThrough();

      const uploadPromise = this.storage.putObject({
        key: finalKey,
        body: output,
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000, immutable',
      });

      await Promise.all([
        uploadPromise,
        pipeline(
          source.stream as NodeJS.ReadableStream,
          handle.transform as NodeJS.WritableStream,
          output,
        ),
      ]);

      const metadata = await handle.getMetadata();
      processed = {
        width: metadata.width,
        height: metadata.height,
        bytes: metadata.bytes,
        mime: metadata.mime,
      };
    }

    const beforeImagesCount = this.getLodgingImages(lodging).length;
    const imageToPersist: LodgingImage = {
      imageId: dto.imageId,
      key: finalKey,
      isDefault: beforeImagesCount === 0,
      width: processed.width,
      height: processed.height,
      bytes: processed.bytes,
      mime: processed.mime,
      createdAt: new Date(),
    };

    const confirmFilter = {
      ...this.buildOwnershipFilters(lodgingId, ownerId, role),
      'pendingImageUploads.imageId': dto.imageId,
      'mediaImages.imageId': { $ne: dto.imageId },
      'mediaImages.4': { $exists: false },
    } as unknown as QueryFilter<LodgingDocument>;

    const updated = await this.lodgingModel.findOneAndUpdate(
      confirmFilter,
      {
        $push: { mediaImages: imageToPersist },
        $pull: { pendingImageUploads: { imageId: dto.imageId } },
      },
      { returnDocument: 'after' },
    );

    if (!updated) {
      const latest = await this.findOwnedLodgingOrThrow(
        lodgingId,
        ownerId,
        role,
      );
      const concurrentExisting = this.getLodgingImages(latest).find(
        (image) => image.imageId === dto.imageId,
      );
      if (concurrentExisting) {
        return {
          image: this.toLodgingImageResponse(concurrentExisting),
          idempotent: true,
        };
      }

      throw new DomainException(
        'No se pudo confirmar la imagen por un conflicto de estado',
        ERROR_CODES.LODGING_IMAGE_INVALID_STATE,
        HttpStatus.CONFLICT,
      );
    }

    if (updated.mediaImages.length > 0) {
      updated.mainImage =
        updated.mediaImages.find((image) => image.isDefault)?.key ??
        updated.mediaImages[0].key;
      updated.images = updated.mediaImages.map((image) => image.key);
      await updated.save();
    }

    await this.ensureLodgingDefaultInvariant(updated);

    try {
      await this.storage.deleteObject(expectedStagingKey);
    } catch {
      // best effort cleanup
    }

    const persisted = this.getLodgingImages(updated).find(
      (image) => image.imageId === dto.imageId,
    );

    if (!persisted) {
      throw new DomainException(
        'Lodging image not found after confirmation',
        ERROR_CODES.LODGING_IMAGE_NOT_FOUND,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      image: this.toLodgingImageResponse(persisted),
    };
  }

  async setDefaultImage(
    lodgingId: string,
    imageId: string,
    ownerId: string,
    role: UserRole,
  ): Promise<SetDefaultLodgingImageResponseDto> {
    const lodging = await this.findOwnedLodgingOrThrow(
      lodgingId,
      ownerId,
      role,
    );
    const images = this.getLodgingImages(lodging);
    const exists = images.some((image) => image.imageId === imageId);

    if (!exists) {
      throw new DomainException(
        'Lodging image not found',
        ERROR_CODES.LODGING_IMAGE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    for (const image of images) {
      image.isDefault = image.imageId === imageId;
    }

    const defaultImage = images.find((image) => image.isDefault);
    lodging.mainImage = defaultImage?.key ?? lodging.mainImage;
    lodging.images = images.map((image) => image.key);

    this.policy.assertValidImagesState(images);
    await lodging.save();

    return {
      images: images.map((image) => this.toLodgingImageResponse(image)),
    };
  }

  async deleteImage(
    lodgingId: string,
    imageId: string,
    ownerId: string,
    role: UserRole,
  ): Promise<DeleteLodgingImageResponseDto> {
    const lodging = await this.findOwnedLodgingOrThrow(
      lodgingId,
      ownerId,
      role,
    );
    const images = this.getLodgingImages(lodging);
    const targetIndex = images.findIndex((image) => image.imageId === imageId);

    if (targetIndex === -1) {
      throw new DomainException(
        'Lodging image not found',
        ERROR_CODES.LODGING_IMAGE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const [removed] = images.splice(targetIndex, 1);

    if (removed?.key) {
      try {
        await this.storage.deleteObject(removed.key);
      } catch {
        // best effort
      }
    }

    if (images.length > 0 && !images.some((image) => image.isDefault)) {
      images[0].isDefault = true;
    }

    lodging.mainImage = images.find((image) => image.isDefault)?.key ?? '';
    lodging.images = images.map((image) => image.key);

    this.policy.assertValidImagesState(images);
    await lodging.save();

    return {
      deleted: true,
      images: images.map((image) => this.toLodgingImageResponse(image)),
    };
  }

  async attachDraftUploadsToLodging(
    lodgingId: string,
    ownerId: string,
    uploadSessionId: string,
    pendingImageIds: string[],
  ): Promise<void> {
    if (pendingImageIds.length === 0) {
      return;
    }

    const ownerObjectId = toObjectIdOrThrow(ownerId, {
      message: 'Invalid owner id',
      errorCode: ERROR_CODES.INVALID_OBJECT_ID,
      httpStatus: HttpStatus.BAD_REQUEST,
    });

    await this.cleanupExpiredDraftUploads(ownerObjectId, uploadSessionId);

    const pendingUploads = await this.pendingDraftUploadModel.find({
      ownerId: ownerObjectId,
      uploadSessionId,
      imageId: { $in: pendingImageIds },
    });

    if (pendingUploads.length !== pendingImageIds.length) {
      throw new DomainException(
        'Some pending lodging draft images were not found',
        ERROR_CODES.LODGING_IMAGE_PENDING_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const pendingById = new Map(
      pendingUploads.map((pending) => [pending.imageId, pending]),
    );
    const orderedUploads = pendingImageIds.map((imageId) => {
      const pending = pendingById.get(imageId);
      if (!pending) {
        throw new DomainException(
          'Pending lodging draft image not found',
          ERROR_CODES.LODGING_IMAGE_PENDING_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      return pending;
    });

    const lodging = await this.findOwnedLodgingOrThrow(
      lodgingId,
      ownerId,
      'OWNER',
    );
    const existingImages = this.getLodgingImages(lodging);

    if (
      existingImages.length + orderedUploads.length >
      this.policy.MAX_IMAGES
    ) {
      throw new DomainException(
        'Lodging image limit exceeded',
        ERROR_CODES.LODGING_IMAGE_LIMIT_EXCEEDED,
        HttpStatus.BAD_REQUEST,
      );
    }

    const uploadedKeys: string[] = [];
    const uploadedImages: LodgingImage[] = [];

    try {
      for (const pending of orderedUploads) {
        this.policy.assertPendingUploadValid(
          {
            imageId: pending.imageId,
            stagingKey: pending.stagingKey,
            createdAt: pending.createdAt,
            expiresAt: pending.expiresAt,
            status: 'PENDING',
          },
          pending.stagingKey,
          new Date(),
        );

        if (pending.status !== 'CONFIRMED') {
          throw new DomainException(
            'Pending lodging draft image upload must be confirmed before create',
            ERROR_CODES.LODGING_IMAGE_INVALID_STATE,
            HttpStatus.BAD_REQUEST,
          );
        }

        const stagingHead = await this.storage.headObject(pending.stagingKey);
        if (!stagingHead.exists) {
          throw new DomainException(
            'Pending draft lodging image upload not found in storage',
            ERROR_CODES.STORAGE_OBJECT_NOT_FOUND,
            HttpStatus.NOT_FOUND,
          );
        }

        this.assertAllowedMime(stagingHead.mime ?? undefined);
        this.assertSizeWithinLimit(
          stagingHead.bytes,
          this.getLodgingMaxBytes(),
        );

        const finalKey = this.buildFinalKey(lodgingId, pending.imageId);
        const source = await this.storage.getObjectStream(pending.stagingKey);
        const handle = this.imageProcessor.createLodgingNormalizerTransform({
          maxWidth: this.getLodgingMaxWidth(),
          maxHeight: this.getLodgingMaxHeight(),
          outputFormat: 'webp',
        });
        const output = new PassThrough();

        const uploadPromise = this.storage.putObject({
          key: finalKey,
          body: output,
          contentType: 'image/webp',
          cacheControl: 'public, max-age=31536000, immutable',
        });

        await Promise.all([
          uploadPromise,
          pipeline(
            source.stream as NodeJS.ReadableStream,
            handle.transform as NodeJS.WritableStream,
            output,
          ),
        ]);

        const metadata = await handle.getMetadata();
        uploadedKeys.push(finalKey);
        uploadedImages.push({
          imageId: pending.imageId,
          key: finalKey,
          isDefault: false,
          width: metadata.width,
          height: metadata.height,
          bytes: metadata.bytes,
          mime: metadata.mime,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      await Promise.all(
        uploadedKeys.map(async (key) => {
          try {
            await this.storage.deleteObject(key);
          } catch {
            // best effort cleanup
          }
        }),
      );
      throw error;
    }

    lodging.mediaImages = [...existingImages, ...uploadedImages];

    if (lodging.mediaImages.length > 0) {
      for (const [index, image] of lodging.mediaImages.entries()) {
        image.isDefault = index === 0;
      }
      lodging.mainImage =
        lodging.mediaImages.find((image) => image.isDefault)?.key ??
        lodging.mediaImages[0].key;
      lodging.images = lodging.mediaImages.map((image) => image.key);
    }

    this.policy.assertValidImagesState(lodging.mediaImages);
    await lodging.save();

    await this.pendingDraftUploadModel.deleteMany({
      _id: { $in: orderedUploads.map((pending) => pending._id) },
    });

    await Promise.all(
      orderedUploads.map(async (pending) => {
        try {
          await this.storage.deleteObject(pending.stagingKey);
        } catch {
          // best effort cleanup
        }
      }),
    );
  }

  private async findOwnedLodgingOrThrow(
    lodgingId: string,
    ownerId: string,
    role: UserRole,
  ): Promise<LodgingDocument> {
    const filters: QueryFilter<LodgingDocument> = {
      _id: toObjectIdOrThrow(lodgingId, {
        message: 'Invalid lodging id',
        errorCode: ERROR_CODES.INVALID_OBJECT_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      }),
    };

    if (role !== 'SUPERADMIN') {
      filters.ownerId = toObjectIdOrThrow(ownerId, {
        message: 'Invalid owner id',
        errorCode: ERROR_CODES.INVALID_OBJECT_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      });
    }

    const lodging = await this.lodgingModel.findOne(filters);

    if (!lodging) {
      throw new DomainException(
        'Lodging not found',
        ERROR_CODES.LODGING_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return lodging;
  }

  buildStagingKey(lodgingId: string, imageId: string): string {
    return `lodgings/${lodgingId}/${imageId}/staging-upload`;
  }

  buildDraftStagingKey(
    ownerId: string,
    uploadSessionId: string,
    imageId: string,
  ): string {
    return `lodgings/drafts/${ownerId}/${uploadSessionId}/${imageId}/staging-upload`;
  }

  buildFinalKey(lodgingId: string, imageId: string): string {
    return `lodgings/${lodgingId}/${imageId}/original.webp`;
  }

  private buildOwnershipFilters(
    lodgingId: string,
    ownerId: string,
    role: UserRole,
  ): Record<string, unknown> {
    const filters: Record<string, unknown> = {
      _id: toObjectIdOrThrow(lodgingId, {
        message: 'Invalid lodging id',
        errorCode: ERROR_CODES.INVALID_OBJECT_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      }),
    };

    if (role !== 'SUPERADMIN') {
      filters.ownerId = toObjectIdOrThrow(ownerId, {
        message: 'Invalid owner id',
        errorCode: ERROR_CODES.INVALID_OBJECT_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      });
    }

    return filters;
  }

  private getLodgingImages(lodging: LodgingDocument): LodgingImage[] {
    return lodging.mediaImages ?? [];
  }

  private getPendingUploads(
    lodging: LodgingDocument,
  ): PendingLodgingImageUpload[] {
    return lodging.pendingImageUploads ?? [];
  }

  private async findPendingDraftUploadOrThrow(
    ownerId: string,
    uploadSessionId: string,
    imageId: string,
  ): Promise<PendingLodgingDraftImageUploadDocument> {
    const pending = await this.pendingDraftUploadModel.findOne({
      ownerId: toObjectIdOrThrow(ownerId, {
        message: 'Invalid owner id',
        errorCode: ERROR_CODES.INVALID_OBJECT_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      }),
      uploadSessionId,
      imageId,
    });

    if (!pending) {
      throw new DomainException(
        'Pending lodging draft image upload not found',
        ERROR_CODES.LODGING_IMAGE_PENDING_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return pending;
  }

  private async cleanupExpiredDraftUploads(
    ownerId: Types.ObjectId,
    uploadSessionId: string,
  ): Promise<void> {
    const expired = await this.pendingDraftUploadModel.find({
      ownerId,
      uploadSessionId,
      expiresAt: { $lt: new Date() },
    });

    await this.deleteDraftUploads(expired);
  }

  private async deleteDraftUploads(
    uploads: PendingLodgingDraftImageUploadDocument[],
  ): Promise<void> {
    if (uploads.length === 0) {
      return;
    }

    await this.pendingDraftUploadModel.deleteMany({
      _id: { $in: uploads.map((upload) => upload._id) },
    });

    await Promise.all(
      uploads.map(async (upload) => {
        try {
          await this.storage.deleteObject(upload.stagingKey);
        } catch {
          // best effort cleanup
        }
      }),
    );
  }

  private async cleanupExpiredLodgingPendingUploads(
    lodging: LodgingDocument,
  ): Promise<Set<string>> {
    const pendingUploads = this.getPendingUploads(lodging);
    if (pendingUploads.length === 0) {
      return new Set<string>();
    }

    const now = Date.now();
    const expired = pendingUploads.filter(
      (pending) => new Date(pending.expiresAt).getTime() < now,
    );

    if (expired.length === 0) {
      return new Set<string>();
    }

    lodging.pendingImageUploads = pendingUploads.filter(
      (pending) =>
        !expired.some((candidate) => candidate.imageId === pending.imageId),
    );
    await lodging.save();

    await Promise.all(
      expired.map(async (pending) => {
        try {
          await this.storage.deleteObject(pending.stagingKey);
        } catch {
          // best effort cleanup
        }
      }),
    );

    return new Set(expired.map((pending) => pending.imageId));
  }

  private async ensureLodgingDefaultInvariant(
    lodging: LodgingDocument,
  ): Promise<void> {
    const images = this.getLodgingImages(lodging);

    if (images.length === 0) {
      return;
    }

    const defaultImages = images.filter((image) => image.isDefault);

    if (defaultImages.length === 1) {
      return;
    }

    for (const image of images) {
      image.isDefault = false;
    }
    images[0].isDefault = true;

    lodging.mainImage = images[0].key;
    lodging.images = images.map((image) => image.key);

    this.policy.assertValidImagesState(images);
    await lodging.save();
  }

  private toLodgingImageResponse(image: LodgingImage): LodgingImageResponseDto {
    return {
      imageId: image.imageId,
      key: image.key,
      isDefault: image.isDefault,
      width: image.width,
      height: image.height,
      bytes: image.bytes,
      mime: image.mime,
      createdAt: new Date(image.createdAt).toISOString(),
      url: this.mediaUrlBuilder.buildPublicUrl(image.key),
      variants: this.mediaUrlBuilder.buildLodgingVariants(image.key),
    };
  }

  private getAllowedMimes(): string[] {
    const csv = this.configService.get<string>('IMAGE_ALLOWED_MIME') ?? '';
    return csv
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  }

  private assertAllowedMime(mime?: string): void {
    if (!mime) {
      return;
    }

    const allowed = this.getAllowedMimes();
    if (allowed.length > 0 && !allowed.includes(mime.toLowerCase())) {
      throw new DomainException(
        'Invalid image mime type',
        ERROR_CODES.LODGING_IMAGE_INVALID_MIME,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertSizeWithinLimit(
    size: number | undefined,
    maxBytes: number,
  ): void {
    if (size !== undefined && size > maxBytes) {
      throw new DomainException(
        'Image size exceeded',
        ERROR_CODES.LODGING_IMAGE_SIZE_EXCEEDED,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private getPendingUploadTtlSeconds(): number {
    return this.getNumberEnv('PENDING_UPLOAD_TTL_SECONDS', 1800);
  }

  private getLodgingMaxBytes(): number {
    return this.getNumberEnv('LODGING_IMAGE_MAX_BYTES', 10 * 1024 * 1024);
  }

  private getLodgingMaxWidth(): number {
    return this.getNumberEnv('LODGING_IMAGE_MAX_WIDTH', 2560);
  }

  private getLodgingMaxHeight(): number {
    return this.getNumberEnv('LODGING_IMAGE_MAX_HEIGHT', 2560);
  }

  private getNumberEnv(name: string, fallback: number): number {
    const raw = this.configService.get<string>(name);
    if (!raw || raw.startsWith('"descripcion')) {
      return fallback;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}
