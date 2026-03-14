import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { PassThrough } from 'stream';
import { Types } from 'mongoose';
import { LodgingImagesService } from './lodging-images.service';
import { Lodging } from '@lodgings/schemas/lodging.schema';
import { PendingLodgingDraftImageUpload } from '@lodgings/schemas/pending-lodging-draft-image-upload.schema';
import {
  IMAGE_PROCESSOR_SERVICE,
  MEDIA_URL_BUILDER,
  OBJECT_STORAGE_SERVICE,
} from '@media/constants/media.tokens';
import { LodgingImagesPolicyService } from '@lodgings/domain/lodging-images-policy.service';
import { ERROR_CODES } from '@common/constants/error-code';

type LodgingImageRecord = {
  imageId: string;
  key: string;
  isDefault: boolean;
  width?: number;
  height?: number;
  bytes?: number;
  mime?: string;
  createdAt: Date;
};

type PendingUploadRecord = {
  imageId: string;
  stagingKey: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'PENDING';
};

type LodgingRecord = {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  mediaImages: LodgingImageRecord[];
  pendingImageUploads: PendingUploadRecord[];
  mainImage: string;
  images: string[];
  save: () => Promise<LodgingRecord>;
};

describe('LodgingImagesService', () => {
  let service: LodgingImagesService;

  const lodgingModelMock = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const pendingDraftUploadModelMock = {
    countDocuments: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    deleteMany: jest.fn(),
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
        PENDING_UPLOAD_TTL_SECONDS: '1800',
        LODGING_IMAGE_MAX_BYTES: String(10 * 1024 * 1024),
        LODGING_IMAGE_MAX_WIDTH: '2560',
        LODGING_IMAGE_MAX_HEIGHT: '2560',
      };
      return values[key];
    }),
  };

  const ownerId = new Types.ObjectId().toString();
  const lodgingId = new Types.ObjectId().toString();

  const createLodgingRecord = (
    overrides?: Partial<LodgingRecord>,
  ): LodgingRecord => ({
    _id: new Types.ObjectId(lodgingId),
    ownerId: new Types.ObjectId(ownerId),
    mediaImages: [],
    pendingImageUploads: [],
    mainImage: '',
    images: [],
    save: jest.fn().mockImplementation(function (this: LodgingRecord) {
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
        LodgingImagesService,
        { provide: getModelToken(Lodging.name), useValue: lodgingModelMock },
        {
          provide: getModelToken(PendingLodgingDraftImageUpload.name),
          useValue: pendingDraftUploadModelMock,
        },
        { provide: OBJECT_STORAGE_SERVICE, useValue: storageMock },
        { provide: IMAGE_PROCESSOR_SERVICE, useValue: imageProcessorMock },
        { provide: MEDIA_URL_BUILDER, useValue: mediaUrlBuilderMock },
        { provide: ConfigService, useValue: configServiceMock },
        LodgingImagesPolicyService,
      ],
    }).compile();

    service = module.get<LodgingImagesService>(LodgingImagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe rechazar uploadImageFile cuando el alojamiento ya tiene 5 imagenes', async () => {
    const lodging = createLodgingRecord({
      mediaImages: Array.from({ length: 5 }, (_, index) => ({
        imageId: `img-${index}`,
        key: `lodgings/${lodgingId}/img-${index}/original.webp`,
        isDefault: index === 0,
        createdAt: new Date(),
      })),
    });
    lodgingModelMock.findOne.mockResolvedValue(lodging);
    lodgingModelMock.findOneAndUpdate.mockResolvedValue(null);
    storageMock.putObject.mockResolvedValue(undefined);
    storageMock.deleteObject.mockResolvedValue(undefined);
    imageProcessorMock.createLodgingNormalizerTransform.mockReturnValue({
      transform: new PassThrough(),
      getMetadata: jest.fn().mockResolvedValue({
        width: 1280,
        height: 720,
        bytes: 222,
        mime: 'image/webp',
      }),
    });

    await expectDomainCode(
      service.uploadImageFile(
        lodgingId,
        {
          buffer: Buffer.from('image'),
          mimetype: 'image/png',
          size: 5,
        },
        ownerId,
        'OWNER',
      ),
      ERROR_CODES.LODGING_IMAGE_LIMIT_EXCEEDED,
    );
  });

  it('debe persistir la imagen subida por backend y marcarla default si es la primera', async () => {
    const finalKeyMatcher = `lodgings/${lodgingId}/`;
    lodgingModelMock.findOne.mockResolvedValue(createLodgingRecord());
    lodgingModelMock.findOneAndUpdate.mockImplementation(
      (
        _filter: unknown,
        update: { $push: { mediaImages: LodgingImageRecord } },
      ) =>
        createLodgingRecord({
          mediaImages: [
            {
              ...update.$push.mediaImages,
              isDefault: true,
            },
          ],
          mainImage: update.$push.mediaImages.key,
          images: [update.$push.mediaImages.key],
        }),
    );
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
        width: 1280,
        height: 720,
        bytes: 222,
        mime: 'image/webp',
      }),
    });

    const result = await service.uploadImageFile(
      lodgingId,
      {
        buffer: Buffer.from('image'),
        mimetype: 'image/png',
        size: 5,
      },
      ownerId,
      'OWNER',
    );

    expect(result.image.key).toContain(finalKeyMatcher);
    expect(result.image.key).toContain('/original.webp');
    expect(result.image.isDefault).toBe(true);
    expect(storageMock.putObject).toHaveBeenCalled();
  });

  it('debe subir draft image y dejarla confirmada para asociacion posterior', async () => {
    pendingDraftUploadModelMock.countDocuments.mockResolvedValue(0);
    pendingDraftUploadModelMock.find.mockResolvedValue([]);
    pendingDraftUploadModelMock.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      imageId: 'img-draft',
      uploadSessionId: 'session-1',
      stagingKey: 'lodgings/drafts/owner/session-1/img-draft/staging-upload',
      status: 'PENDING',
      save: jest.fn().mockResolvedValue(undefined),
    });
    storageMock.putObject.mockResolvedValue(undefined);

    const result = await service.uploadDraftImageFile(
      { uploadSessionId: 'session-1' },
      {
        buffer: Buffer.from('image'),
        mimetype: 'image/png',
        size: 5,
      },
      ownerId,
    );

    expect(result).toEqual({
      imageId: 'img-draft',
      uploadSessionId: 'session-1',
      confirmed: true,
    });
    expect(storageMock.putObject).toHaveBeenCalled();
  });

  it('debe rechazar uploadImageFile si el alojamiento no pertenece al owner autenticado', async () => {
    lodgingModelMock.findOne.mockResolvedValue(null);

    await expectDomainCode(
      service.uploadImageFile(
        lodgingId,
        {
          buffer: Buffer.from('image'),
          mimetype: 'image/png',
          size: 5,
        },
        ownerId,
        'OWNER',
      ),
      ERROR_CODES.LODGING_NOT_FOUND,
    );
  });
});
