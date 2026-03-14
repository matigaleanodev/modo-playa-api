import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Module,
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
import { AuthProfileImageController } from '../src/auth/auth-profile-image.controller';
import { ERROR_CODES } from '../src/common/constants/error-code';
import { createAppValidationPipe } from '../src/common/pipes/app-validation.pipe';
import {
  IMAGE_PROCESSOR_SERVICE,
  MEDIA_URL_BUILDER,
  OBJECT_STORAGE_SERVICE,
} from '../src/media/constants/media.tokens';
import { User } from '../src/users/schemas/user.schema';
import { UserProfileImagesService } from '../src/users/services/user-profile-images.service';

type UserRecord = {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  email: string;
  username: string;
  isActive: boolean;
  isPasswordSet: boolean;
  avatarUrl: string | null;
  profileImage: null | {
    imageId: string;
    key: string;
    width: number;
    height: number;
    bytes: number;
    mime: string;
    createdAt: Date;
  };
  pendingProfileImageUploads: Array<{
    imageId: string;
    stagingKey: string;
    createdAt: Date;
    expiresAt: Date;
    status: 'PENDING';
  }>;
  save: () => Promise<UserRecord>;
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
          width: 640,
          height: 640,
          bytes: 18,
          mime: 'image/webp',
        }),
    };
  }
}

class InMemoryUserModel {
  static records: UserRecord[] = [];

  static reset() {
    InMemoryUserModel.records = [];
  }

  static createBaseRecord(): UserRecord {
    const record: UserRecord = {
      _id: new Types.ObjectId(authenticatedUser.userId),
      ownerId: new Types.ObjectId(authenticatedUser.ownerId),
      email: 'owner@modoplaya.app',
      username: 'owner',
      isActive: true,
      isPasswordSet: true,
      avatarUrl: null,
      profileImage: null,
      pendingProfileImageUploads: [],
      save: () => {
        const index = InMemoryUserModel.records.findIndex((item) =>
          item._id.equals(record._id),
        );
        if (index === -1) {
          InMemoryUserModel.records.push(record);
        } else {
          InMemoryUserModel.records[index] = record;
        }
        return Promise.resolve(record);
      },
    };

    return record;
  }

  static findOne(filters: Record<string, unknown>) {
    const found =
      InMemoryUserModel.records.find((record) => {
        if (filters._id && !record._id.equals(filters._id as Types.ObjectId)) {
          return false;
        }
        if (
          filters.ownerId &&
          !record.ownerId.equals(filters.ownerId as Types.ObjectId)
        ) {
          return false;
        }
        return true;
      }) ?? null;

    return Promise.resolve(found);
  }

  static updateOne(
    filters: Record<string, unknown>,
    update: Record<string, unknown>,
  ) {
    const user = InMemoryUserModel.records.find(
      (record) =>
        record._id.equals(filters._id as Types.ObjectId) &&
        record.ownerId.equals(filters.ownerId as Types.ObjectId),
    );

    if (!user) {
      return Promise.resolve({ acknowledged: true, matchedCount: 0 });
    }

    const push = update.$push as
      | {
          pendingProfileImageUploads?: UserRecord['pendingProfileImageUploads'][number];
        }
      | undefined;
    const set = update.$set as
      | { profileImage?: UserRecord['profileImage']; avatarUrl?: string | null }
      | undefined;

    if (push?.pendingProfileImageUploads) {
      user.pendingProfileImageUploads.push(push.pendingProfileImageUploads);
    }

    if (set) {
      if ('profileImage' in set) {
        user.profileImage = set.profileImage ?? null;
      }
      if ('avatarUrl' in set) {
        user.avatarUrl = set.avatarUrl ?? null;
      }
    }

    return Promise.resolve({ acknowledged: true, matchedCount: 1 });
  }

  static findOneAndUpdate(
    filters: Record<string, unknown>,
    update: Record<string, unknown>,
  ) {
    const user =
      InMemoryUserModel.records.find((record) => {
        if (!record._id.equals(filters._id as Types.ObjectId)) {
          return false;
        }
        if (!record.ownerId.equals(filters.ownerId as Types.ObjectId)) {
          return false;
        }
        const pendingImageId = filters['pendingProfileImageUploads.imageId'];
        if (
          pendingImageId &&
          !record.pendingProfileImageUploads.some(
            (pending) => pending.imageId === pendingImageId,
          )
        ) {
          return false;
        }
        return true;
      }) ?? null;

    if (!user) {
      return Promise.resolve(null);
    }

    const set = update.$set as {
      profileImage: NonNullable<UserRecord['profileImage']>;
      avatarUrl: string;
    };
    const pull = update.$pull as {
      pendingProfileImageUploads: { imageId: string };
    };

    user.profileImage = set.profileImage;
    user.avatarUrl = set.avatarUrl;
    user.pendingProfileImageUploads = user.pendingProfileImageUploads.filter(
      (pending) => pending.imageId !== pull.pendingProfileImageUploads.imageId,
    );

    return Promise.resolve(user);
  }
}

const configServiceStub = {
  get: (key: string) => {
    const values: Record<string, string> = {
      IMAGE_ALLOWED_MIME: 'image/png,image/jpeg,image/webp',
      PENDING_UPLOAD_TTL_SECONDS: '1800',
      USER_PROFILE_IMAGE_MAX_BYTES: String(5 * 1024 * 1024),
      USER_PROFILE_IMAGE_MAX_WIDTH: '1024',
      USER_PROFILE_IMAGE_MAX_HEIGHT: '1024',
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
  controllers: [AuthProfileImageController],
  providers: [
    UserProfileImagesService,
    {
      provide: getModelToken(User.name),
      useValue: InMemoryUserModel,
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
  ],
})
class TestProfileMediaRuntimeModule {}

describe('Profile media runtime flow (e2e)', () => {
  let app: INestApplication<App>;
  let storage: InMemoryObjectStorageService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestProfileMediaRuntimeModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(createAppValidationPipe());
    await app.init();

    storage = moduleFixture.get(OBJECT_STORAGE_SERVICE);
  });

  beforeEach(() => {
    InMemoryUserModel.reset();
    InMemoryUserModel.records.push(InMemoryUserModel.createBaseRecord());
    storage.objects.clear();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('ejecuta upload-url y confirm de profile image con service real', async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post('/api/auth/me/profile-image/upload-url')
      .send({
        mime: 'image/png',
        size: 12,
      })
      .expect(201);

    const { imageId, uploadKey } = uploadResponse.body as {
      imageId: string;
      uploadKey: string;
    };

    storage.seedObject(uploadKey, Buffer.from('fake-image'), 'image/png');

    const confirmResponse = await request(app.getHttpServer())
      .post('/api/auth/me/profile-image/confirm')
      .send({
        imageId,
        key: uploadKey,
      })
      .expect(201);

    const body = confirmResponse.body as {
      image: { imageId: string; key: string };
    };

    expect(body.image.imageId).toBe(imageId);
    expect(body.image.key).toContain('/original.webp');
    expect(storage.objects.has(uploadKey)).toBe(false);
  });

  it('rechaza confirm de profile image expirado y limpia pending + staging', async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post('/api/auth/me/profile-image/upload-url')
      .send({
        mime: 'image/png',
        size: 12,
      })
      .expect(201);

    const { imageId, uploadKey } = uploadResponse.body as {
      imageId: string;
      uploadKey: string;
    };

    const user = InMemoryUserModel.records[0];
    user.pendingProfileImageUploads[0].expiresAt = new Date(
      Date.now() - 60_000,
    );
    storage.seedObject(uploadKey, Buffer.from('fake-image'), 'image/png');

    await request(app.getHttpServer())
      .post('/api/auth/me/profile-image/confirm')
      .send({
        imageId,
        key: uploadKey,
      })
      .expect(400)
      .expect({
        message: 'Pending profile image upload expired',
        code: ERROR_CODES.LODGING_IMAGE_PENDING_EXPIRED,
      });

    expect(user.pendingProfileImageUploads).toHaveLength(0);
    expect(storage.objects.has(uploadKey)).toBe(false);
  });
});
