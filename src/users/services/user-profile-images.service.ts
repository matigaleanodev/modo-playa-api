import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { PassThrough, Readable } from 'stream';
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
import type { UploadedImageFile } from '@media/interfaces/uploaded-image-file.interface';
import { User, UserDocument } from '@users/schemas/user.schema';
import { ConfirmUserProfileImageResponseDto } from '@users/dto/confirm-user-profile-image-response.dto';
import { DeleteUserProfileImageResponseDto } from '@users/dto/delete-user-profile-image-response.dto';
import { UserProfileImageResponseDto } from '@users/dto/user-profile-image-response.dto';
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

  async uploadOwnProfileImageFile(
    ownerId: string,
    userId: string,
    file: UploadedImageFile,
  ): Promise<ConfirmUserProfileImageResponseDto> {
    this.assertImageFile(file, this.getUserProfileMaxBytes());

    const user = await this.findOwnedUserOrThrow(ownerId, userId);
    const currentProfileImage = user.profileImage;
    const imageId = randomUUID();
    const finalKey = this.buildFinalKey(userId, imageId);
    const handle = this.imageProcessor.createLodgingNormalizerTransform({
      maxWidth: this.getUserProfileMaxWidth(),
      maxHeight: this.getUserProfileMaxHeight(),
      outputFormat: 'webp',
      quality: 84,
    });
    const output = new PassThrough();

    try {
      const uploadPromise = this.storage.putObject({
        key: finalKey,
        body: output,
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000, immutable',
      });

      await Promise.all([
        uploadPromise,
        pipeline(
          Readable.from(file.buffer),
          handle.transform as NodeJS.WritableStream,
          output,
        ),
      ]);
    } catch (error) {
      try {
        await this.storage.deleteObject(finalKey);
      } catch {
        // best effort cleanup
      }
      throw error;
    }

    const metadata = await handle.getMetadata();
    const profileImage = {
      imageId,
      key: finalKey,
      width: metadata.width,
      height: metadata.height,
      bytes: metadata.bytes,
      mime: metadata.mime,
      createdAt: new Date(),
    };

    const updated = await this.userModel.findOneAndUpdate(
      {
        _id: toObjectIdOrThrow(userId, {
          message: 'Invalid user id',
          errorCode: ERROR_CODES.INVALID_USER_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
        ownerId: toObjectIdOrThrow(ownerId, {
          message: 'Invalid owner id',
          errorCode: ERROR_CODES.INVALID_OWNER_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
      },
      {
        $set: {
          profileImage,
          avatarUrl: this.mediaUrlBuilder.buildPublicUrl(finalKey),
        },
      },
      { returnDocument: 'after' },
    );

    if (!updated?.profileImage) {
      try {
        await this.storage.deleteObject(finalKey);
      } catch {
        // best effort cleanup
      }

      throw new DomainException(
        'No se pudo guardar la imagen de perfil',
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

    return {
      image: this.toProfileImageResponse(updated.profileImage),
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
          errorCode: ERROR_CODES.INVALID_USER_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
        ownerId: toObjectIdOrThrow(ownerId, {
          message: 'Invalid owner id',
          errorCode: ERROR_CODES.INVALID_OWNER_ID,
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
        errorCode: ERROR_CODES.INVALID_USER_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      }),
      ownerId: toObjectIdOrThrow(ownerId, {
        message: 'Invalid owner id',
        errorCode: ERROR_CODES.INVALID_OWNER_ID,
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

  buildFinalKey(userId: string, imageId: string): string {
    return `users/${userId}/profile/${imageId}/original.webp`;
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

  private assertImageFile(
    file: UploadedImageFile | undefined,
    maxBytes: number,
  ): asserts file is UploadedImageFile {
    if (!file) {
      throw new DomainException(
        'Image file is required',
        ERROR_CODES.REQUEST_VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }

    this.assertAllowedMime(file.mimetype);
    this.assertSizeWithinLimit(file.size, maxBytes);
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
