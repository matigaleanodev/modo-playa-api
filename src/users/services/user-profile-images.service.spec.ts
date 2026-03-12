import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Readable, PassThrough } from 'stream';
import { Types } from 'mongoose';
import { UserProfileImagesService } from './user-profile-images.service';
import { User } from '@users/schemas/user.schema';
import {
  IMAGE_PROCESSOR_SERVICE,
  MEDIA_URL_BUILDER,
  OBJECT_STORAGE_SERVICE,
} from '@media/constants/media.tokens';
import { ERROR_CODES } from '@common/constants/error-code';

type PendingUpload = {
  imageId: string;
  stagingKey: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'PENDING';
};

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
  pendingProfileImageUploads: PendingUpload[];
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
    createSignedPutUrl: jest.fn(),
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
        PENDING_UPLOAD_TTL_SECONDS: '1800',
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
    pendingProfileImageUploads: [],
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

  it('debe rechazar la signed url si el usuario no pertenece al owner autenticado', async () => {
    userModelMock.findOne.mockResolvedValue(null);

    await expectDomainCode(
      service.createUploadUrl(ownerId, userId, {
        mime: 'image/png',
        size: 100,
      }),
      ERROR_CODES.USER_NOT_FOUND,
    );
  });

  it('debe devolver la imagen existente sin duplicar metadata al reintentar confirm', async () => {
    const existingImage: ProfileImage = {
      imageId: 'img-1',
      key: 'users/u/profile/img-1/original.webp',
      width: 400,
      height: 400,
      bytes: 1234,
      mime: 'image/webp',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    userModelMock.findOne.mockResolvedValue(
      createUserRecord({
        profileImage: existingImage,
      }),
    );

    const result = await service.confirmUpload(ownerId, userId, {
      imageId: 'img-1',
      key: `users/${userId}/profile/img-1/staging-upload`,
    });

    expect(result.idempotent).toBe(true);
    expect(result.image.imageId).toBe('img-1');
    expect(userModelMock.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('debe reemplazar la imagen de perfil previa sin duplicar metadata', async () => {
    const currentImage: ProfileImage = {
      imageId: 'img-old',
      key: 'users/u/profile/img-old/original.webp',
      width: 300,
      height: 300,
      bytes: 1000,
      mime: 'image/webp',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const pendingKey = `users/${userId}/profile/img-new/staging-upload`;
    const finalKey = `users/${userId}/profile/img-new/original.webp`;
    const user = createUserRecord({
      profileImage: currentImage,
      pendingProfileImageUploads: [
        {
          imageId: 'img-new',
          stagingKey: pendingKey,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
          status: 'PENDING',
        },
      ],
    });
    userModelMock.findOne.mockResolvedValue(user);
    storageMock.headObject
      .mockResolvedValueOnce({
        exists: true,
        bytes: 123,
        mime: 'image/png',
      })
      .mockResolvedValueOnce({
        exists: true,
        bytes: 456,
        mime: 'image/webp',
      });
    userModelMock.findOneAndUpdate.mockResolvedValue(
      createUserRecord({
        profileImage: {
          imageId: 'img-new',
          key: finalKey,
          width: undefined,
          height: undefined,
          bytes: 456,
          mime: 'image/webp',
          createdAt: new Date(),
        },
      }),
    );

    const result = await service.confirmUpload(ownerId, userId, {
      imageId: 'img-new',
      key: pendingKey,
    });

    expect(result.image.imageId).toBe('img-new');
    expect(userModelMock.findOneAndUpdate).toHaveBeenCalled();
    expect(storageMock.deleteObject).toHaveBeenCalledWith(currentImage.key);
    expect(storageMock.deleteObject).toHaveBeenCalledWith(pendingKey);
    expect(storageMock.getObjectStream).not.toHaveBeenCalled();
  });

  it('debe fallar la confirmación si el objeto no existe en storage', async () => {
    const pendingKey = `users/${userId}/profile/img-missing/staging-upload`;
    userModelMock.findOne.mockResolvedValue(
      createUserRecord({
        pendingProfileImageUploads: [
          {
            imageId: 'img-missing',
            stagingKey: pendingKey,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 60_000),
            status: 'PENDING',
          },
        ],
      }),
    );
    storageMock.headObject.mockResolvedValue({ exists: false });

    await expectDomainCode(
      service.confirmUpload(ownerId, userId, {
        imageId: 'img-missing',
        key: pendingKey,
      }),
      ERROR_CODES.STORAGE_OBJECT_NOT_FOUND,
    );
  });

  it('debe invocar getObjectStream para procesar la imagen sin cargarla completa en memoria', async () => {
    const pendingKey = `users/${userId}/profile/img-stream/staging-upload`;
    const finalKey = `users/${userId}/profile/img-stream/original.webp`;
    userModelMock.findOne.mockResolvedValue(
      createUserRecord({
        pendingProfileImageUploads: [
          {
            imageId: 'img-stream',
            stagingKey: pendingKey,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 60_000),
            status: 'PENDING',
          },
        ],
      }),
    );
    storageMock.headObject
      .mockResolvedValueOnce({
        exists: true,
        bytes: 120,
        mime: 'image/png',
      })
      .mockResolvedValueOnce({
        exists: false,
      });
    storageMock.getObjectStream.mockResolvedValue({
      stream: Readable.from(Buffer.from('image-binary')),
    });
    storageMock.putObject.mockImplementation(
      async ({ body }: { body: NodeJS.ReadableStream }): Promise<void> => {
        for await (const _chunk of body as AsyncIterable<unknown>) {
          void _chunk;
        }
      },
    );
    imageProcessorMock.createLodgingNormalizerTransform.mockReturnValue({
      transform: new PassThrough(),
      getMetadata: jest.fn().mockResolvedValue({
        width: 640,
        height: 640,
        bytes: 222,
        mime: 'image/webp',
      }),
    });
    userModelMock.findOneAndUpdate.mockResolvedValue(
      createUserRecord({
        profileImage: {
          imageId: 'img-stream',
          key: finalKey,
          width: 640,
          height: 640,
          bytes: 222,
          mime: 'image/webp',
          createdAt: new Date(),
        },
      }),
    );

    await service.confirmUpload(ownerId, userId, {
      imageId: 'img-stream',
      key: pendingKey,
      width: 640,
      height: 640,
    });

    expect(storageMock.getObjectStream).toHaveBeenCalledWith(pendingKey);
    expect(storageMock.putObject).toHaveBeenCalled();
    expect(userModelMock.findOneAndUpdate).toHaveBeenCalled();
  });
});
