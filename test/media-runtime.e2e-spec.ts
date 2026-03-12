import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import { Readable, PassThrough } from 'stream';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../src/auth/guard/auth.guard';
import { RequestUser } from '../src/auth/interfaces/request-user.interface';
import { ERROR_CODES } from '../src/common/constants/error-code';
import { LodgingDraftImageUploadsAdminController } from '../src/lodgings/controllers/lodging-draft-image-uploads.controller';
import { LodgingsAdminController } from '../src/lodgings/controllers/lodgings.controller';
import { LodgingImagesService } from '../src/lodgings/services/lodging-images.service';
import { LodgingsService } from '../src/lodgings/lodgings.service';
import { LodgingImagesPolicyService } from '../src/lodgings/domain/lodging-images-policy.service';
import { Contact } from '../src/contacts/schemas/contact.schema';
import { Lodging } from '../src/lodgings/schemas/lodging.schema';
import { PendingLodgingDraftImageUpload } from '../src/lodgings/schemas/pending-lodging-draft-image-upload.schema';
import {
  IMAGE_PROCESSOR_SERVICE,
  MEDIA_URL_BUILDER,
  OBJECT_STORAGE_SERVICE,
} from '../src/media/constants/media.tokens';

type LodgingRecord = {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  title: string;
  description: string;
  location: string;
  city: string;
  type: string;
  price: number;
  priceUnit: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  minNights: number;
  amenities: string[];
  mainImage: string;
  images: string[];
  mediaImages: Array<{
    imageId: string;
    key: string;
    isDefault: boolean;
    width: number;
    height: number;
    bytes: number;
    mime: string;
    createdAt: Date;
  }>;
  pendingImageUploads: Array<unknown>;
  occupiedRanges: Array<unknown>;
  contactId?: Types.ObjectId;
  active: boolean;
  populate: () => Promise<LodgingRecord>;
  save: () => Promise<LodgingRecord>;
};

type PendingDraftRecord = {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  uploadSessionId: string;
  imageId: string;
  stagingKey: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'PENDING' | 'CONFIRMED';
  save: () => Promise<PendingDraftRecord>;
};

const authenticatedUser: RequestUser = {
  userId: '507f1f77bcf86cd799439012',
  ownerId: '507f1f77bcf86cd799439011',
  role: 'OWNER',
  purpose: 'ACCESS',
};

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: RequestUser }>();
    request.user = authenticatedUser;
    return true;
  }
}

class InMemoryObjectStorageService {
  readonly objects = new Map<string, { body: Buffer; mime: string }>();

  createSignedPutUrl(input: {
    key: string;
    contentType: string;
    contentLength?: number;
  }) {
    return Promise.resolve({
      url: `https://signed.test/${input.key}`,
      method: 'PUT' as const,
      requiredHeaders: {
        'Content-Type': input.contentType,
        ...(input.contentLength !== undefined
          ? { 'Content-Length': String(input.contentLength) }
          : {}),
      },
      expiresInSeconds: 600,
    });
  }

  headObject(key: string) {
    const object = this.objects.get(key);
    if (!object) {
      return Promise.resolve({ exists: false });
    }

    return Promise.resolve({
      exists: true,
      bytes: object.body.length,
      mime: object.mime,
    });
  }

  objectExists(key: string) {
    return Promise.resolve(this.objects.has(key));
  }

  getObjectStream(key: string) {
    const object = this.objects.get(key);
    return Promise.resolve({
      stream: Readable.from(object?.body ?? Buffer.from([])),
      bytes: object?.body.length,
      mime: object?.mime,
    });
  }

  async putObject(input: {
    key: string;
    body: NodeJS.ReadableStream;
    contentType: string;
  }): Promise<void> {
    const chunks: Buffer[] = [];
    for await (const chunk of input.body as AsyncIterable<unknown>) {
      chunks.push(
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string),
      );
    }
    this.objects.set(input.key, {
      body: Buffer.concat(chunks),
      mime: input.contentType,
    });
  }

  deleteObject(key: string): Promise<void> {
    this.objects.delete(key);
    return Promise.resolve();
  }

  seedObject(key: string, body: Buffer, mime: string) {
    this.objects.set(key, { body, mime });
  }
}

class InMemoryImageProcessorService {
  createLodgingNormalizerTransform() {
    const transform = new PassThrough();
    return {
      transform,
      getMetadata: () =>
        Promise.resolve({
          width: 1280,
          height: 720,
          bytes: 24,
          mime: 'image/webp',
        }),
    };
  }
}

class InMemoryLodgingModel {
  static records: LodgingRecord[] = [];

  _doc: LodgingRecord;

  constructor(data: Partial<LodgingRecord>) {
    const record = InMemoryLodgingModel.buildRecord(data);
    this._doc = record;
  }

  static reset() {
    InMemoryLodgingModel.records = [];
  }

  static buildRecord(data: Partial<LodgingRecord>): LodgingRecord {
    const record = {
      _id: data._id ?? new Types.ObjectId(),
      ownerId: data.ownerId ?? new Types.ObjectId(),
      title: data.title ?? '',
      description: data.description ?? '',
      location: data.location ?? '',
      city: data.city ?? '',
      type: data.type ?? '',
      price: data.price ?? 0,
      priceUnit: data.priceUnit ?? 'night',
      maxGuests: data.maxGuests ?? 1,
      bedrooms: data.bedrooms ?? 1,
      bathrooms: data.bathrooms ?? 1,
      minNights: data.minNights ?? 1,
      amenities: data.amenities ?? [],
      mainImage: data.mainImage ?? '',
      images: data.images ?? [],
      mediaImages: data.mediaImages ?? [],
      pendingImageUploads: data.pendingImageUploads ?? [],
      occupiedRanges: data.occupiedRanges ?? [],
      contactId: data.contactId,
      active: data.active ?? true,
      populate: () => Promise.resolve(record),
      save: () => {
        const index = InMemoryLodgingModel.records.findIndex((item) =>
          item._id.equals(record._id),
        );
        if (index === -1) {
          InMemoryLodgingModel.records.push(record);
        } else {
          InMemoryLodgingModel.records[index] = record;
        }
        return Promise.resolve(record);
      },
    };

    return record;
  }

  async save() {
    return this._doc.save();
  }

  static findOne(filters: Record<string, unknown>) {
    const found =
      InMemoryLodgingModel.records.find((record) => {
        if (filters._id && !record._id.equals(filters._id as Types.ObjectId)) {
          return false;
        }
        if (
          filters.ownerId &&
          !record.ownerId.equals(filters.ownerId as Types.ObjectId)
        ) {
          return false;
        }
        if (
          filters.active !== undefined &&
          record.active !== Boolean(filters.active)
        ) {
          return false;
        }
        return true;
      }) ?? null;

    return found;
  }

  static deleteOne(filters: Record<string, unknown>) {
    InMemoryLodgingModel.records = InMemoryLodgingModel.records.filter(
      (record) => !record._id.equals(filters._id as Types.ObjectId),
    );
    return Promise.resolve({ deletedCount: 1 });
  }
}

class InMemoryContactModel {
  static findOne() {
    return Promise.resolve(null);
  }
}

class InMemoryPendingDraftModel {
  static records: PendingDraftRecord[] = [];

  static reset() {
    InMemoryPendingDraftModel.records = [];
  }

  static countDocuments(filters: {
    ownerId: Types.ObjectId;
    uploadSessionId: string;
  }) {
    return Promise.resolve(
      InMemoryPendingDraftModel.records.filter(
        (record) =>
          record.ownerId.equals(filters.ownerId) &&
          record.uploadSessionId === filters.uploadSessionId,
      ).length,
    );
  }

  static create(data: Partial<PendingDraftRecord>) {
    const record: PendingDraftRecord = {
      _id: new Types.ObjectId(),
      ownerId: data.ownerId as Types.ObjectId,
      uploadSessionId: data.uploadSessionId!,
      imageId: data.imageId!,
      stagingKey: data.stagingKey!,
      createdAt: new Date(),
      expiresAt: data.expiresAt!,
      status: data.status as 'PENDING' | 'CONFIRMED',
      save: () => Promise.resolve(record),
    };
    InMemoryPendingDraftModel.records.push(record);
    return Promise.resolve(record);
  }

  static findOne(filters: {
    ownerId: Types.ObjectId;
    uploadSessionId: string;
    imageId: string;
  }) {
    return Promise.resolve(
      InMemoryPendingDraftModel.records.find(
        (record) =>
          record.ownerId.equals(filters.ownerId) &&
          record.uploadSessionId === filters.uploadSessionId &&
          record.imageId === filters.imageId,
      ) ?? null,
    );
  }

  static find(filters: {
    ownerId: Types.ObjectId;
    uploadSessionId: string;
    imageId?: { $in: string[] };
    expiresAt?: { $lt: Date };
  }) {
    return Promise.resolve(
      InMemoryPendingDraftModel.records.filter(
        (record) =>
          record.ownerId.equals(filters.ownerId) &&
          record.uploadSessionId === filters.uploadSessionId &&
          (!filters.imageId || filters.imageId.$in.includes(record.imageId)) &&
          (!filters.expiresAt ||
            record.expiresAt.getTime() < filters.expiresAt.$lt.getTime()),
      ),
    );
  }

  static deleteMany(filters: {
    _id?: { $in: Types.ObjectId[] };
    ownerId?: Types.ObjectId;
    uploadSessionId?: string;
    expiresAt?: { $lt: Date };
  }): Promise<void> {
    InMemoryPendingDraftModel.records =
      InMemoryPendingDraftModel.records.filter((record) => {
        if (filters._id) {
          return !filters._id.$in.some((candidate) =>
            candidate.equals(record._id),
          );
        }
        if (filters.ownerId && !record.ownerId.equals(filters.ownerId)) {
          return true;
        }
        if (
          filters.uploadSessionId &&
          record.uploadSessionId !== filters.uploadSessionId
        ) {
          return true;
        }
        if (
          filters.expiresAt &&
          record.expiresAt.getTime() >= filters.expiresAt.$lt.getTime()
        ) {
          return true;
        }
        return false;
      });
    return Promise.resolve();
  }
}

const configServiceStub = {
  get: (key: string) => {
    const values: Record<string, string> = {
      IMAGE_ALLOWED_MIME: 'image/png,image/jpeg,image/webp',
      PENDING_UPLOAD_TTL_SECONDS: '1800',
      LODGING_IMAGE_MAX_BYTES: String(10 * 1024 * 1024),
      LODGING_IMAGE_MAX_WIDTH: '2560',
      LODGING_IMAGE_MAX_HEIGHT: '2560',
      MEDIA_PUBLIC_BASE_URL: 'https://media.test',
    };
    return values[key];
  },
};

const mediaUrlBuilderStub = {
  buildPublicUrl: (value: string) => `https://media.test/${value}`,
  buildLodgingVariants: (value: string) => ({
    thumb: `https://media.test/thumb/${value}`,
    card: `https://media.test/card/${value}`,
    hero: `https://media.test/hero/${value}`,
  }),
};

@Module({
  controllers: [
    LodgingDraftImageUploadsAdminController,
    LodgingsAdminController,
  ],
  providers: [
    LodgingImagesService,
    LodgingsService,
    {
      provide: getModelToken(Lodging.name),
      useValue: InMemoryLodgingModel,
    },
    {
      provide: getModelToken(Contact.name),
      useValue: InMemoryContactModel,
    },
    {
      provide: getModelToken(PendingLodgingDraftImageUpload.name),
      useValue: InMemoryPendingDraftModel,
    },
    {
      provide: OBJECT_STORAGE_SERVICE,
      useClass: InMemoryObjectStorageService,
    },
    {
      provide: IMAGE_PROCESSOR_SERVICE,
      useClass: InMemoryImageProcessorService,
    },
    {
      provide: MEDIA_URL_BUILDER,
      useValue: mediaUrlBuilderStub,
    },
    {
      provide: ConfigService,
      useValue: configServiceStub,
    },
    LodgingImagesPolicyService,
  ],
})
class TestMediaRuntimeModule {}

describe('Media runtime flow (e2e)', () => {
  let app: INestApplication<App>;
  let storage: InMemoryObjectStorageService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestMediaRuntimeModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    storage = moduleFixture.get(OBJECT_STORAGE_SERVICE);
  });

  beforeEach(() => {
    InMemoryLodgingModel.reset();
    InMemoryPendingDraftModel.reset();
    storage.objects.clear();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('ejecuta upload-url, confirm y create de lodging con services reales', async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post('/api/admin/lodging-image-uploads/upload-url')
      .send({
        uploadSessionId: 'runtime-session-1',
        mime: 'image/png',
        size: 12,
      })
      .expect(201);

    const { imageId, uploadKey } = uploadResponse.body as {
      imageId: string;
      uploadKey: string;
    };

    storage.seedObject(uploadKey, Buffer.from('fake-image'), 'image/png');

    await request(app.getHttpServer())
      .post('/api/admin/lodging-image-uploads/confirm')
      .send({
        uploadSessionId: 'runtime-session-1',
        imageId,
      })
      .expect(201)
      .expect({
        imageId,
        uploadSessionId: 'runtime-session-1',
        confirmed: true,
      });

    const createResponse = await request(app.getHttpServer())
      .post('/api/admin/lodgings')
      .send({
        title: 'Runtime Cabin',
        description: 'Runtime flow',
        location: 'Beach 123',
        city: 'Mar Azul',
        type: 'house',
        price: 100,
        priceUnit: 'night',
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        minNights: 2,
        uploadSessionId: 'runtime-session-1',
        pendingImageIds: [imageId],
      })
      .expect(201);

    const responseBody = createResponse.body as {
      title: string;
      mainImage: string;
      images: string[];
      mediaImages: Array<{ imageId: string; isDefault: boolean }>;
    };

    expect(responseBody.title).toBe('Runtime Cabin');
    expect(responseBody.mediaImages).toHaveLength(1);
    expect(responseBody.mediaImages[0].imageId).toBe(imageId);
    expect(responseBody.mediaImages[0].isDefault).toBe(true);
    expect(responseBody.mainImage).toContain('/lodgings/');
    expect(responseBody.images).toHaveLength(1);
  });

  it('rechaza confirm de draft expirado y limpia pending + staging', async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post('/api/admin/lodging-image-uploads/upload-url')
      .send({
        uploadSessionId: 'runtime-session-expired',
        mime: 'image/png',
        size: 12,
      })
      .expect(201);

    const { imageId, uploadKey } = uploadResponse.body as {
      imageId: string;
      uploadKey: string;
    };

    const pending = InMemoryPendingDraftModel.records[0];
    pending.expiresAt = new Date(Date.now() - 60_000);
    storage.seedObject(uploadKey, Buffer.from('fake-image'), 'image/png');

    await request(app.getHttpServer())
      .post('/api/admin/lodging-image-uploads/confirm')
      .send({
        uploadSessionId: 'runtime-session-expired',
        imageId,
      })
      .expect(400)
      .expect({
        message: 'Pending lodging draft image upload expired',
        code: ERROR_CODES.LODGING_IMAGE_PENDING_EXPIRED,
      });

    expect(InMemoryPendingDraftModel.records).toHaveLength(0);
    expect(storage.objects.has(uploadKey)).toBe(false);
  });
});
