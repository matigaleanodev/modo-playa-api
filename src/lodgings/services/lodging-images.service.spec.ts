import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Readable, PassThrough } from 'stream';
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
    findOne: jest.fn(),
    find: jest.fn(),
    deleteMany: jest.fn(),
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

  it('debe rechazar la generación de signed url cuando el alojamiento ya tiene 5 imágenes o reservas pendientes', async () => {
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

    await expectDomainCode(
      service.createUploadUrl(
        lodgingId,
        { mime: 'image/png', size: 1234 },
        ownerId,
        'OWNER',
      ),
      ERROR_CODES.LODGING_IMAGE_LIMIT_EXCEEDED,
    );
  });

  it('debe devolver la imagen existente sin duplicar metadata cuando confirm se reintenta con el mismo imageId', async () => {
    const existingImage: LodgingImageRecord = {
      imageId: 'img-1',
      key: `lodgings/${lodgingId}/img-1/original.webp`,
      isDefault: true,
      width: 800,
      height: 600,
      bytes: 1234,
      mime: 'image/webp',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    lodgingModelMock.findOne.mockResolvedValue(
      createLodgingRecord({
        mediaImages: [existingImage],
        mainImage: existingImage.key,
        images: [existingImage.key],
      }),
    );

    const result = await service.confirmUpload(
      lodgingId,
      {
        imageId: 'img-1',
        key: `lodgings/${lodgingId}/img-1/staging-upload`,
      },
      ownerId,
      'OWNER',
    );

    expect(result.idempotent).toBe(true);
    expect(result.image.imageId).toBe('img-1');
    expect(storageMock.headObject).not.toHaveBeenCalled();
  });

  it('debe persistir metadata sin reprocesar cuando finalKey ya existe y no existe metadata', async () => {
    const pendingKey = `lodgings/${lodgingId}/img-2/staging-upload`;
    const finalKey = `lodgings/${lodgingId}/img-2/original.webp`;
    const lodging = createLodgingRecord({
      pendingImageUploads: [
        {
          imageId: 'img-2',
          stagingKey: pendingKey,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
          status: 'PENDING',
        },
      ],
    });
    lodgingModelMock.findOne.mockResolvedValue(lodging);
    storageMock.headObject
      .mockResolvedValueOnce({
        exists: true,
        bytes: 321,
        mime: 'image/png',
      })
      .mockResolvedValueOnce({
        exists: true,
        bytes: 654,
        mime: 'image/webp',
      });
    lodgingModelMock.findOneAndUpdate.mockResolvedValue(
      createLodgingRecord({
        mediaImages: [
          {
            imageId: 'img-2',
            key: finalKey,
            isDefault: true,
            width: undefined,
            height: undefined,
            bytes: 654,
            mime: 'image/webp',
            createdAt: new Date(),
          },
        ],
        mainImage: finalKey,
        images: [finalKey],
      }),
    );

    const result = await service.confirmUpload(
      lodgingId,
      {
        imageId: 'img-2',
        key: pendingKey,
      },
      ownerId,
      'OWNER',
    );

    expect(result.image.imageId).toBe('img-2');
    expect(storageMock.getObjectStream).not.toHaveBeenCalled();
    expect(lodgingModelMock.findOneAndUpdate).toHaveBeenCalled();
  });

  it('debe impedir superar el límite de 5 al confirmar bajo concurrencia mediante actualización atómica', async () => {
    const pendingKey = `lodgings/${lodgingId}/img-3/staging-upload`;
    const before = createLodgingRecord({
      pendingImageUploads: [
        {
          imageId: 'img-3',
          stagingKey: pendingKey,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
          status: 'PENDING',
        },
      ],
    });
    const after = createLodgingRecord({
      mediaImages: Array.from({ length: 5 }, (_, index) => ({
        imageId: `img-concurrent-${index}`,
        key: `lodgings/${lodgingId}/img-concurrent-${index}/original.webp`,
        isDefault: index === 0,
        createdAt: new Date(),
      })),
    });
    lodgingModelMock.findOne
      .mockResolvedValueOnce(before)
      .mockResolvedValueOnce(after);
    storageMock.headObject
      .mockResolvedValueOnce({
        exists: true,
        bytes: 111,
        mime: 'image/png',
      })
      .mockResolvedValueOnce({
        exists: true,
        bytes: 222,
        mime: 'image/webp',
      });
    lodgingModelMock.findOneAndUpdate.mockResolvedValue(null);

    await expectDomainCode(
      service.confirmUpload(
        lodgingId,
        {
          imageId: 'img-3',
          key: pendingKey,
        },
        ownerId,
        'OWNER',
      ),
      ERROR_CODES.LODGING_IMAGE_INVALID_STATE,
    );
  });

  it.each([
    {
      name: 'pending inexistente',
      lodging: createLodgingRecord(),
      errorCode: ERROR_CODES.LODGING_IMAGE_PENDING_NOT_FOUND,
    },
    {
      name: 'pending expirado',
      lodging: createLodgingRecord({
        pendingImageUploads: [
          {
            imageId: 'img-4',
            stagingKey: `lodgings/${lodgingId}/img-4/staging-upload`,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() - 60_000),
            status: 'PENDING',
          },
        ],
      }),
      errorCode: ERROR_CODES.LODGING_IMAGE_PENDING_EXPIRED,
    },
  ])(
    'debe fallar la confirmación si la reserva $name',
    async ({ lodging, errorCode }) => {
      lodgingModelMock.findOne.mockResolvedValue(lodging);

      await expectDomainCode(
        service.confirmUpload(
          lodgingId,
          {
            imageId: 'img-4',
            key: `lodgings/${lodgingId}/img-4/staging-upload`,
          },
          ownerId,
          'OWNER',
        ),
        errorCode,
      );
    },
  );

  it('debe fallar la confirmación si headObject informa un tamaño mayor al máximo permitido', async () => {
    const pendingKey = `lodgings/${lodgingId}/img-5/staging-upload`;
    lodgingModelMock.findOne.mockResolvedValue(
      createLodgingRecord({
        pendingImageUploads: [
          {
            imageId: 'img-5',
            stagingKey: pendingKey,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 60_000),
            status: 'PENDING',
          },
        ],
      }),
    );
    storageMock.headObject.mockResolvedValue({
      exists: true,
      bytes: 11 * 1024 * 1024,
      mime: 'image/png',
    });

    await expectDomainCode(
      service.confirmUpload(
        lodgingId,
        {
          imageId: 'img-5',
          key: pendingKey,
        },
        ownerId,
        'OWNER',
      ),
      ERROR_CODES.LODGING_IMAGE_SIZE_EXCEEDED,
    );
  });

  it('debe invocar getObjectStream para procesar la imagen sin cargarla completa en memoria', async () => {
    const pendingKey = `lodgings/${lodgingId}/img-6/staging-upload`;
    const finalKey = `lodgings/${lodgingId}/img-6/original.webp`;
    lodgingModelMock.findOne.mockResolvedValue(
      createLodgingRecord({
        pendingImageUploads: [
          {
            imageId: 'img-6',
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
        width: 1280,
        height: 720,
        bytes: 222,
        mime: 'image/webp',
      }),
    });
    lodgingModelMock.findOneAndUpdate.mockResolvedValue(
      createLodgingRecord({
        mediaImages: [
          {
            imageId: 'img-6',
            key: finalKey,
            isDefault: true,
            width: 1280,
            height: 720,
            bytes: 222,
            mime: 'image/webp',
            createdAt: new Date(),
          },
        ],
        mainImage: finalKey,
        images: [finalKey],
      }),
    );

    await service.confirmUpload(
      lodgingId,
      {
        imageId: 'img-6',
        key: pendingKey,
        width: 1280,
        height: 720,
      },
      ownerId,
      'OWNER',
    );

    expect(storageMock.getObjectStream).toHaveBeenCalledWith(pendingKey);
    expect(storageMock.putObject).toHaveBeenCalled();
  });

  it('debe marcar como predeterminada la imagen indicada y desmarcar las demás', async () => {
    const lodging = createLodgingRecord({
      mediaImages: [
        {
          imageId: 'img-1',
          key: `lodgings/${lodgingId}/img-1/original.webp`,
          isDefault: true,
          createdAt: new Date(),
        },
        {
          imageId: 'img-2',
          key: `lodgings/${lodgingId}/img-2/original.webp`,
          isDefault: false,
          createdAt: new Date(),
        },
      ],
    });
    lodgingModelMock.findOne.mockResolvedValue(lodging);

    const result = await service.setDefaultImage(
      lodgingId,
      'img-2',
      ownerId,
      'OWNER',
    );

    expect(
      result.images.find((image) => image.imageId === 'img-2')?.isDefault,
    ).toBe(true);
    expect(
      result.images.find((image) => image.imageId === 'img-1')?.isDefault,
    ).toBe(false);
  });

  it('debe reasignar una imagen predeterminada al borrar la imagen default', async () => {
    const imageOneKey = `lodgings/${lodgingId}/img-1/original.webp`;
    const imageTwoKey = `lodgings/${lodgingId}/img-2/original.webp`;
    const lodging = createLodgingRecord({
      mediaImages: [
        {
          imageId: 'img-1',
          key: imageOneKey,
          isDefault: true,
          createdAt: new Date(),
        },
        {
          imageId: 'img-2',
          key: imageTwoKey,
          isDefault: false,
          createdAt: new Date(),
        },
      ],
      mainImage: imageOneKey,
      images: [imageOneKey, imageTwoKey],
    });
    lodgingModelMock.findOne.mockResolvedValue(lodging);

    const result = await service.deleteImage(
      lodgingId,
      'img-1',
      ownerId,
      'OWNER',
    );

    expect(result.deleted).toBe(true);
    expect(result.images).toHaveLength(1);
    expect(result.images[0].imageId).toBe('img-2');
    expect(result.images[0].isDefault).toBe(true);
    expect(storageMock.deleteObject).toHaveBeenCalledWith(imageOneKey);
  });

  it('debe fallar la confirmación si el objeto no existe en storage', async () => {
    const pendingKey = `lodgings/${lodgingId}/img-7/staging-upload`;
    lodgingModelMock.findOne.mockResolvedValue(
      createLodgingRecord({
        pendingImageUploads: [
          {
            imageId: 'img-7',
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
      service.confirmUpload(
        lodgingId,
        {
          imageId: 'img-7',
          key: pendingKey,
        },
        ownerId,
        'OWNER',
      ),
      ERROR_CODES.STORAGE_OBJECT_NOT_FOUND,
    );
  });

  it('debe rechazar la signed url si el alojamiento no pertenece al owner autenticado', async () => {
    lodgingModelMock.findOne.mockResolvedValue(null);

    await expectDomainCode(
      service.createUploadUrl(
        lodgingId,
        { mime: 'image/png', size: 100 },
        ownerId,
        'OWNER',
      ),
      ERROR_CODES.LODGING_NOT_FOUND,
    );
  });
});
