import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { PassThrough } from 'stream';
import { Types } from 'mongoose';
import { UserProfileImagesService } from './user-profile-images.service';
import { User } from '@users/schemas/user.schema';
import {
  IMAGE_PROCESSOR_SERVICE,
  MEDIA_URL_BUILDER,
  OBJECT_STORAGE_SERVICE,
} from '@media/constants/media.tokens';
import { ERROR_CODES } from '@common/constants/error-code';

type ProfileImage = {
  imageId: string;
  key: string;
  width?: number;
  height?: number;
  bytes?: number;
  mime?: string;
  createdAt: Date;
};

type UserRecord = {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  email: string;
  username: string;
  profileImage?: ProfileImage | null;
  avatarUrl?: string | null;
  save: () => Promise<UserRecord>;
};

describe('UserProfileImagesService', () => {
  let service: UserProfileImagesService;

  const userModelMock = {
    findOne: jest.fn(),
    updateOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const storageMock = {
    headObject: jest.fn(),
    getObjectStream: jest.fn(),
    putObject: jest.fn(),
    deleteObject: jest.fn(),
  };

  const imageProcessorMock = {
    createLodgingNormalizerTransform: jest.fn(),
  };

  const mediaUrlBuilderMock = {
    buildPublicUrl: jest.fn((key: string) => `https://media.test/${key}`),
    buildLodgingVariants: jest.fn((key: string) => ({
      thumb: `thumb/${key}`,
      card: `card/${key}`,
      hero: `hero/${key}`,
    })),
  };

  const configServiceMock = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        IMAGE_ALLOWED_MIME: 'image/png,image/jpeg,image/webp',
        USER_PROFILE_IMAGE_MAX_BYTES: String(5 * 1024 * 1024),
        USER_PROFILE_IMAGE_MAX_WIDTH: '1024',
        USER_PROFILE_IMAGE_MAX_HEIGHT: '1024',
      };
      return values[key];
    }),
  };

  const ownerId = new Types.ObjectId().toString();
  const userId = new Types.ObjectId().toString();

  const createUserRecord = (overrides?: Partial<UserRecord>): UserRecord => ({
    _id: new Types.ObjectId(userId),
    ownerId: new Types.ObjectId(ownerId),
    email: 'owner@modoplaya.app',
    username: 'owner',
    profileImage: null,
    avatarUrl: null,
    save: jest.fn().mockImplementation(function (this: UserRecord) {
      return Promise.resolve(this);
    }),
    ...overrides,
  });

  const expectDomainCode = async (
    promise: Promise<unknown>,
    code: string,
  ): Promise<void> => {
    await expect(promise).rejects.toBeInstanceOf(Error);
    await promise.catch((error: unknown) => {
      expect(error).toBeInstanceOf(Error);
      const response = (
        error as { getResponse?: () => unknown }
      ).getResponse?.() as { code?: string } | undefined;
      expect(response?.code).toBe(code);
    });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProfileImagesService,
        { provide: getModelToken(User.name), useValue: userModelMock },
        { provide: OBJECT_STORAGE_SERVICE, useValue: storageMock },
        { provide: IMAGE_PROCESSOR_SERVICE, useValue: imageProcessorMock },
        { provide: MEDIA_URL_BUILDER, useValue: mediaUrlBuilderMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<UserProfileImagesService>(UserProfileImagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe rechazar uploadOwnProfileImageFile si el usuario no pertenece al owner autenticado', async () => {
    userModelMock.findOne.mockResolvedValue(null);

    await expectDomainCode(
      service.uploadOwnProfileImageFile(ownerId, userId, {
        buffer: Buffer.from('image'),
        mimetype: 'image/png',
        size: 5,
      }),
      ERROR_CODES.USER_NOT_FOUND,
    );
  });

  it('debe devolver codigo explicito si userId es invalido', async () => {
    await expectDomainCode(
      service.uploadOwnProfileImageFile(ownerId, 'invalid-user-id', {
        buffer: Buffer.from('image'),
        mimetype: 'image/png',
        size: 5,
      }),
      ERROR_CODES.INVALID_USER_ID,
    );
  });

  it('debe reemplazar la imagen de perfil previa por upload backend-only', async () => {
    const currentImage: ProfileImage = {
      imageId: 'img-old',
      key: 'users/u/profile/img-old/original.webp',
      width: 300,
      height: 300,
      bytes: 1000,
      mime: 'image/webp',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const updatedProfileImage: ProfileImage = {
      imageId: 'img-new',
      key: `users/${userId}/profile/img-new/original.webp`,
      width: 640,
      height: 640,
      bytes: 222,
      mime: 'image/webp',
      createdAt: new Date(),
    };
    userModelMock.findOne.mockResolvedValue(
      createUserRecord({
        profileImage: currentImage,
      }),
    );
    userModelMock.findOneAndUpdate.mockResolvedValue(
      createUserRecord({
        profileImage: updatedProfileImage,
        avatarUrl: `https://media.test/${updatedProfileImage.key}`,
      }),
    );
    storageMock.putObject.mockImplementation(
      async ({ body }: { body: NodeJS.ReadableStream }): Promise<void> => {
        for await (const _chunk of body as AsyncIterable<unknown>) {
          void _chunk;
        }
      },
    );
    storageMock.deleteObject.mockResolvedValue(undefined);
    imageProcessorMock.createLodgingNormalizerTransform.mockReturnValue({
      transform: new PassThrough(),
      getMetadata: jest.fn().mockResolvedValue({
        width: 640,
        height: 640,
        bytes: 222,
        mime: 'image/webp',
      }),
    });

    const result = await service.uploadOwnProfileImageFile(ownerId, userId, {
      buffer: Buffer.from('image'),
      mimetype: 'image/png',
      size: 5,
    });

    expect(result.image.imageId).toBe('img-new');
    expect(storageMock.putObject).toHaveBeenCalled();
    expect(storageMock.deleteObject).toHaveBeenCalledWith(currentImage.key);
  });

  it('debe exigir archivo valido para uploadOwnProfileImageFile', async () => {
    await expectDomainCode(
      service.uploadOwnProfileImageFile(ownerId, userId, undefined as never),
      ERROR_CODES.REQUEST_VALIDATION_ERROR,
    );
  });
});
