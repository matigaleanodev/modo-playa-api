import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../src/auth/guard/auth.guard';
import { RequestUser } from '../src/auth/interfaces/request-user.interface';
import { LodgingDraftImageUploadsAdminController } from '../src/lodgings/controllers/lodging-draft-image-uploads.controller';
import { LodgingsAdminController } from '../src/lodgings/controllers/lodgings.controller';
import { LodgingImagesService } from '../src/lodgings/services/lodging-images.service';
import { LodgingsService } from '../src/lodgings/lodgings.service';
import { AuthProfileImageController } from '../src/auth/auth-profile-image.controller';
import { UserProfileImagesService } from '../src/users/services/user-profile-images.service';
import { MEDIA_URL_BUILDER } from '../src/media/constants/media.tokens';

const mockLodgingImagesService = {
  createDraftUploadUrl: jest.fn(),
  confirmDraftUpload: jest.fn(),
};

const mockLodgingsService = {
  create: jest.fn(),
};

const mockUserProfileImagesService = {
  createUploadUrl: jest.fn(),
  confirmUpload: jest.fn(),
  deleteProfileImage: jest.fn(),
};

const mockMediaUrlBuilder = {
  buildPublicUrl: jest
    .fn()
    .mockImplementation((value: string) => `https://media.test/${value}`),
  buildLodgingVariants: jest.fn().mockImplementation((value: string) => ({
    thumb: `https://media.test/thumb/${value}`,
    card: `https://media.test/card/${value}`,
    hero: `https://media.test/hero/${value}`,
  })),
};

const authenticatedUser: RequestUser = {
  userId: '507f1f77bcf86cd799439012',
  ownerId: '507f1f77bcf86cd799439011',
  role: 'SUPERADMIN',
  purpose: 'ACCESS',
};

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: RequestUser }>();
    request.user = authenticatedUser;
    return true;
  }
}

@Module({
  controllers: [
    LodgingDraftImageUploadsAdminController,
    LodgingsAdminController,
    AuthProfileImageController,
  ],
  providers: [
    {
      provide: LodgingImagesService,
      useValue: mockLodgingImagesService,
    },
    {
      provide: LodgingsService,
      useValue: mockLodgingsService,
    },
    {
      provide: UserProfileImagesService,
      useValue: mockUserProfileImagesService,
    },
    {
      provide: MEDIA_URL_BUILDER,
      useValue: mockMediaUrlBuilder,
    },
  ],
})
class TestMediaFlowsModule {}

describe('Media flows (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestMediaFlowsModule],
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/admin/lodging-image-uploads/upload-url crea upload pendiente de borrador', async () => {
    mockLodgingImagesService.createDraftUploadUrl.mockResolvedValue({
      imageId: 'image-1',
      uploadKey: 'lodgings/drafts/owner/session/image-1/staging-upload',
      uploadUrl: 'https://signed.test/upload',
      method: 'PUT',
      requiredHeaders: { 'Content-Type': 'image/png' },
      expiresInSeconds: 600,
    });

    await request(app.getHttpServer())
      .post('/api/admin/lodging-image-uploads/upload-url')
      .send({
        uploadSessionId: 'draft-session-1',
        mime: 'image/png',
        size: 1234,
      })
      .expect(201)
      .expect({
        imageId: 'image-1',
        uploadKey: 'lodgings/drafts/owner/session/image-1/staging-upload',
        uploadUrl: 'https://signed.test/upload',
        method: 'PUT',
        requiredHeaders: { 'Content-Type': 'image/png' },
        expiresInSeconds: 600,
      });

    expect(mockLodgingImagesService.createDraftUploadUrl).toHaveBeenCalledWith(
      {
        uploadSessionId: 'draft-session-1',
        mime: 'image/png',
        size: 1234,
      },
      authenticatedUser.ownerId,
    );
  });

  it('POST /api/admin/lodging-image-uploads/upload-url valida DTOs requeridos', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/lodging-image-uploads/upload-url')
      .send({
        mime: 'image/png',
        size: 1234,
      })
      .expect(400);

    expect(
      mockLodgingImagesService.createDraftUploadUrl,
    ).not.toHaveBeenCalled();
  });

  it('POST /api/admin/lodgings permite alta con pendingImageIds, uploadSessionId y targetOwnerId', async () => {
    mockLodgingsService.create.mockResolvedValue({
      _id: 'lodging-1',
      title: 'Cabana',
      description: 'Desc',
      location: 'Loc',
      city: 'Mar Azul',
      type: 'house',
      price: 100,
      priceUnit: 'night',
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      minNights: 2,
      amenities: [],
      mainImage: 'lodgings/lodging-1/image-1/original.webp',
      images: ['lodgings/lodging-1/image-1/original.webp'],
      mediaImages: [],
    });

    await request(app.getHttpServer())
      .post('/api/admin/lodgings')
      .send({
        title: 'Cabana',
        description: 'Desc',
        location: 'Loc',
        city: 'Mar Azul',
        type: 'house',
        price: 100,
        priceUnit: 'night',
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        minNights: 2,
        uploadSessionId: 'draft-session-1',
        pendingImageIds: ['image-1'],
        targetOwnerId: '507f1f77bcf86cd799439099',
      })
      .expect(201);

    expect(mockLodgingsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        uploadSessionId: 'draft-session-1',
        pendingImageIds: ['image-1'],
        targetOwnerId: '507f1f77bcf86cd799439099',
      }),
      authenticatedUser.ownerId,
      authenticatedUser.role,
    );
  });

  it('POST /api/auth/me/profile-image/upload-url usa el usuario autenticado', async () => {
    mockUserProfileImagesService.createUploadUrl.mockResolvedValue({
      imageId: 'profile-1',
      uploadKey: 'users/u/profile/profile-1/staging-upload',
      uploadUrl: 'https://signed.test/profile',
      method: 'PUT',
      requiredHeaders: { 'Content-Type': 'image/webp' },
      expiresInSeconds: 600,
    });

    await request(app.getHttpServer())
      .post('/api/auth/me/profile-image/upload-url')
      .send({
        mime: 'image/webp',
        size: 2048,
      })
      .expect(201);

    expect(mockUserProfileImagesService.createUploadUrl).toHaveBeenCalledWith(
      authenticatedUser.ownerId,
      authenticatedUser.userId,
      {
        mime: 'image/webp',
        size: 2048,
      },
    );
  });

  it('POST /api/auth/me/profile-image/confirm confirma la imagen propia', async () => {
    mockUserProfileImagesService.confirmUpload.mockResolvedValue({
      image: {
        imageId: 'profile-1',
        key: 'users/u/profile/profile-1/original.webp',
        width: 400,
        height: 400,
        bytes: 12345,
        mime: 'image/webp',
        createdAt: '2026-03-12T12:00:00.000Z',
        url: 'https://media.test/users/u/profile/profile-1/original.webp',
      },
    });

    await request(app.getHttpServer())
      .post('/api/auth/me/profile-image/confirm')
      .send({
        imageId: 'profile-1',
        key: 'users/u/profile/profile-1/staging-upload',
        width: 400,
        height: 400,
      })
      .expect(201);

    expect(mockUserProfileImagesService.confirmUpload).toHaveBeenCalledWith(
      authenticatedUser.ownerId,
      authenticatedUser.userId,
      {
        imageId: 'profile-1',
        key: 'users/u/profile/profile-1/staging-upload',
        width: 400,
        height: 400,
      },
    );
  });

  it('DELETE /api/auth/me/profile-image elimina la imagen propia', async () => {
    mockUserProfileImagesService.deleteProfileImage.mockResolvedValue({
      deleted: true,
    });

    await request(app.getHttpServer())
      .delete('/api/auth/me/profile-image')
      .expect(200)
      .expect({ deleted: true });

    expect(
      mockUserProfileImagesService.deleteProfileImage,
    ).toHaveBeenCalledWith(authenticatedUser.ownerId, authenticatedUser.userId);
  });
});
