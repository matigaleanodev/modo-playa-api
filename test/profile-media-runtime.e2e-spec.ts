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
import { PassThrough, Readable } from 'stream';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../src/auth/guard/auth.guard';
import { RequestUser } from '../src/auth/interfaces/request-user.interface';
import { AuthProfileImageController } from '../src/auth/auth-profile-image.controller';
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

    const set = update.$set as
      | { profileImage?: UserRecord['profileImage']; avatarUrl?: string | null }
      | undefined;

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
        return true;
      }) ?? null;

    if (!user) {
      return Promise.resolve(null);
    }

    const set = update.$set as {
      profileImage: NonNullable<UserRecord['profileImage']>;
      avatarUrl: string;
    };

    user.profileImage = set.profileImage;
    user.avatarUrl = set.avatarUrl;

    return Promise.resolve(user);
  }
}

const configServiceStub = {
  get: (key: string) => {
    const values: Record<string, string> = {
      IMAGE_ALLOWED_MIME: 'image/png,image/jpeg,image/webp',
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

  it('ejecuta upload de profile image con service real', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/me/profile-image')
      .attach('file', Buffer.from('fake-image'), {
        filename: 'profile.png',
        contentType: 'image/png',
      })
      .expect(201);

    const body = response.body as {
      image: { imageId: string; key: string };
    };

    expect(body.image.imageId).toBeTruthy();
    expect(body.image.key).toContain('/original.webp');
    expect(Array.from(storage.objects.keys())[0]).toContain('/original.webp');
  });
});
