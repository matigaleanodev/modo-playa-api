import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { PassThrough } from 'stream';
import { pipeline } from 'stream/promises';
import { ERROR_CODES } from '@common/constants/error-code';
import { DomainException } from '@common/exceptions/domain.exception';
import { toObjectIdOrThrow } from '@common/utils/object-id.util';
import {
  IMAGE_PROCESSOR_SERVICE,
  MEDIA_URL_BUILDER,
  OBJECT_STORAGE_SERVICE,
} from '@media/constants/media.tokens';
import type { ImageProcessorService } from '@media/interfaces/image-processor.interface';
import type { ObjectStorageService } from '@media/interfaces/object-storage.service.interface';
import type { MediaUrlBuilder } from '@media/interfaces/media-url-builder.interface';
import { User, UserDocument } from '@users/schemas/user.schema';
import { RequestUserProfileImageUploadUrlDto } from '@users/dto/request-user-profile-image-upload-url.dto';
import { UserProfileImageUploadUrlResponseDto } from '@users/dto/user-profile-image-upload-url-response.dto';
import { ConfirmUserProfileImageDto } from '@users/dto/confirm-user-profile-image.dto';
import { ConfirmUserProfileImageResponseDto } from '@users/dto/confirm-user-profile-image-response.dto';
import { DeleteUserProfileImageResponseDto } from '@users/dto/delete-user-profile-image-response.dto';
import { UserProfileImageResponseDto } from '@users/dto/user-profile-image-response.dto';
import { PendingUserProfileImageUpload } from '@users/schemas/pending-user-profile-image-upload.schema';
import { UserProfileImage } from '@users/schemas/user-profile-image.schema';

@Injectable()
export class UserProfileImagesService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly storage: ObjectStorageService,
    @Inject(IMAGE_PROCESSOR_SERVICE)
    private readonly imageProcessor: ImageProcessorService,
    @Inject(MEDIA_URL_BUILDER)
    private readonly mediaUrlBuilder: MediaUrlBuilder,
    private readonly configService: ConfigService,
  ) {}

  async createUploadUrl(
    ownerId: string,
    userId: string,
    dto: RequestUserProfileImageUploadUrlDto,
  ): Promise<UserProfileImageUploadUrlResponseDto> {
    this.assertAllowedMime(dto.mime);
    this.assertSizeWithinLimit(dto.size, this.getUserProfileMaxBytes());

    await this.findOwnedUserOrThrow(ownerId, userId);

    const imageId = randomUUID();
    const stagingKey = this.buildStagingKey(userId, imageId);
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + this.getPendingUploadTtlSeconds() * 1000,
    );

    await this.userModel.updateOne(
      {
        _id: toObjectIdOrThrow(userId, {
          message: 'Invalid user id',
          errorCode: ERROR_CODES.INVALID_OBJECT_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
        ownerId: toObjectIdOrThrow(ownerId, {
          message: 'Invalid owner id',
          errorCode: ERROR_CODES.INVALID_OBJECT_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
      },
      {
        $push: {
          pendingProfileImageUploads: {
            imageId,
            stagingKey,
            createdAt: now,
            expiresAt,
            status: 'PENDING',
          },
        },
      },
    );

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
    ownerId: string,
    userId: string,
    dto: ConfirmUserProfileImageDto,
  ): Promise<ConfirmUserProfileImageResponseDto> {
    const user = await this.findOwnedUserOrThrow(ownerId, userId);
    const currentProfileImage = user.profileImage;

    if (currentProfileImage?.imageId === dto.imageId) {
      return {
        image: this.toProfileImageResponse(currentProfileImage),
        idempotent: true,
      };
    }

    const expectedStagingKey = this.buildStagingKey(userId, dto.imageId);
    const pendingUploads = this.getPendingUploads(user);
    const pending = pendingUploads.find((item) => item.imageId === dto.imageId);

    this.assertPendingValid(pending, expectedStagingKey);

    const stagingHead = await this.storage.headObject(expectedStagingKey);
    if (!stagingHead.exists) {
      throw new DomainException(
        'Pending profile image upload not found in storage',
        ERROR_CODES.STORAGE_OBJECT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertAllowedMime(stagingHead.mime ?? undefined);
    this.assertSizeWithinLimit(
      stagingHead.bytes,
      this.getUserProfileMaxBytes(),
    );

    const finalKey = this.buildFinalKey(userId, dto.imageId);
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
        maxWidth: this.getUserProfileMaxWidth(),
        maxHeight: this.getUserProfileMaxHeight(),
        outputFormat: 'webp',
        quality: 84,
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

    const profileImage = {
      imageId: dto.imageId,
      key: finalKey,
      width: processed.width,
      height: processed.height,
      bytes: processed.bytes,
      mime: processed.mime,
      createdAt: new Date(),
    };

    const updated = await this.userModel.findOneAndUpdate(
      {
        _id: toObjectIdOrThrow(userId, {
          message: 'Invalid user id',
          errorCode: ERROR_CODES.INVALID_OBJECT_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
        ownerId: toObjectIdOrThrow(ownerId, {
          message: 'Invalid owner id',
          errorCode: ERROR_CODES.INVALID_OBJECT_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
        'pendingProfileImageUploads.imageId': dto.imageId,
      },
      {
        $set: {
          profileImage,
          avatarUrl: this.mediaUrlBuilder.buildPublicUrl(finalKey),
        },
        $pull: {
          pendingProfileImageUploads: { imageId: dto.imageId },
        },
      },
      { returnDocument: 'after' },
    );

    if (!updated) {
      const latest = await this.findOwnedUserOrThrow(ownerId, userId);
      const latestProfile = latest.profileImage;
      if (latestProfile?.imageId === dto.imageId) {
        return {
          image: this.toProfileImageResponse(latestProfile),
          idempotent: true,
        };
      }

      throw new DomainException(
        'No se pudo confirmar la imagen de perfil por conflicto de estado',
        ERROR_CODES.LODGING_IMAGE_INVALID_STATE,
        HttpStatus.CONFLICT,
      );
    }

    if (currentProfileImage?.key && currentProfileImage.key !== finalKey) {
      try {
        await this.storage.deleteObject(currentProfileImage.key);
      } catch {
        // best effort
      }
    }

    try {
      await this.storage.deleteObject(expectedStagingKey);
    } catch {
      // best effort
    }

    return {
      image: this.toProfileImageResponse(updated.profileImage!),
    };
  }

  async deleteProfileImage(
    ownerId: string,
    userId: string,
  ): Promise<DeleteUserProfileImageResponseDto> {
    const user = await this.findOwnedUserOrThrow(ownerId, userId);
    const profileImage = user.profileImage;

    if (profileImage?.key) {
      try {
        await this.storage.deleteObject(profileImage.key);
      } catch {
        // best effort
      }
    }

    await this.userModel.updateOne(
      {
        _id: toObjectIdOrThrow(userId, {
          message: 'Invalid user id',
          errorCode: ERROR_CODES.INVALID_OBJECT_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
        ownerId: toObjectIdOrThrow(ownerId, {
          message: 'Invalid owner id',
          errorCode: ERROR_CODES.INVALID_OBJECT_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
      },
      {
        $set: {
          profileImage: null,
          avatarUrl: null,
        },
      },
    );

    return { deleted: true };
  }

  private async findOwnedUserOrThrow(
    ownerId: string,
    userId: string,
  ): Promise<UserDocument> {
    const user = await this.userModel.findOne({
      _id: toObjectIdOrThrow(userId, {
        message: 'Invalid user id',
        errorCode: ERROR_CODES.INVALID_OBJECT_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      }),
      ownerId: toObjectIdOrThrow(ownerId, {
        message: 'Invalid owner id',
        errorCode: ERROR_CODES.INVALID_OBJECT_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      }),
    });

    if (!user) {
      throw new DomainException(
        'User not found',
        ERROR_CODES.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return user;
  }

  buildStagingKey(userId: string, imageId: string): string {
    return `users/${userId}/profile/${imageId}/staging-upload`;
  }

  buildFinalKey(userId: string, imageId: string): string {
    return `users/${userId}/profile/${imageId}/original.webp`;
  }

  private getPendingUploads(
    user: UserDocument,
  ): PendingUserProfileImageUpload[] {
    return user.pendingProfileImageUploads ?? [];
  }

  private assertPendingValid(
    pending:
      | Pick<
          PendingUserProfileImageUpload,
          'imageId' | 'stagingKey' | 'expiresAt'
        >
      | undefined,
    expectedKey: string,
  ): void {
    if (!pending) {
      throw new DomainException(
        'Pending profile image upload not found',
        ERROR_CODES.LODGING_IMAGE_PENDING_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (pending.stagingKey !== expectedKey) {
      throw new DomainException(
        'Invalid profile image upload key',
        ERROR_CODES.LODGING_IMAGE_UPLOAD_INVALID_KEY,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (new Date(pending.expiresAt).getTime() < Date.now()) {
      throw new DomainException(
        'Pending profile image upload expired',
        ERROR_CODES.LODGING_IMAGE_PENDING_EXPIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private toProfileImageResponse(
    image: Pick<
      UserProfileImage,
      'imageId' | 'key' | 'width' | 'height' | 'bytes' | 'mime' | 'createdAt'
    >,
  ): UserProfileImageResponseDto {
    return {
      imageId: image.imageId,
      key: image.key,
      width: image.width,
      height: image.height,
      bytes: image.bytes,
      mime: image.mime,
      createdAt: new Date(image.createdAt).toISOString(),
      url: this.mediaUrlBuilder.buildPublicUrl(image.key),
      variants: this.mediaUrlBuilder.buildLodgingVariants(image.key),
    };
  }

  private getPendingUploadTtlSeconds(): number {
    return this.getNumberEnv('PENDING_UPLOAD_TTL_SECONDS', 1800);
  }

  private getUserProfileMaxBytes(): number {
    return this.getNumberEnv('USER_PROFILE_IMAGE_MAX_BYTES', 5 * 1024 * 1024);
  }

  private getUserProfileMaxWidth(): number {
    return this.getNumberEnv('USER_PROFILE_IMAGE_MAX_WIDTH', 1024);
  }

  private getUserProfileMaxHeight(): number {
    return this.getNumberEnv('USER_PROFILE_IMAGE_MAX_HEIGHT', 1024);
  }

  private getAllowedMimes(): string[] {
    const csv = this.configService.get<string>('IMAGE_ALLOWED_MIME') ?? '';
    return csv
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  }

  private assertAllowedMime(mime?: string): void {
    if (!mime) return;

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

  private getNumberEnv(name: string, fallback: number): number {
    const raw = this.configService.get<string>(name);
    if (!raw || raw.startsWith('"descripcion')) {
      return fallback;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}
