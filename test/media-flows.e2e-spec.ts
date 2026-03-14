import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Module,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../src/auth/guard/auth.guard';
import { RequestUser } from '../src/auth/interfaces/request-user.interface';
import { DomainException } from '../src/common/exceptions/domain.exception';
import { ERROR_CODES } from '../src/common/constants/error-code';
import { LodgingDraftImageUploadsAdminController } from '../src/lodgings/controllers/lodging-draft-image-uploads-admin.controller';
import { LodgingsAdminController } from '../src/lodgings/controllers/lodgings.controller';
import { LodgingImagesService } from '../src/lodgings/services/lodging-images.service';
import { LodgingsService } from '../src/lodgings/lodgings.service';
import { AuthProfileImageController } from '../src/auth/auth-profile-image.controller';
import { UserProfileImagesService } from '../src/users/services/user-profile-images.service';
import { MEDIA_URL_BUILDER } from '../src/media/constants/media.tokens';
import { createAppValidationPipe } from '../src/common/pipes/app-validation.pipe';

const mockLodgingImagesService = {
  uploadDraftImageFile: jest.fn(),
};

const mockLodgingsService = {
  create: jest.fn(),
};

const mockUserProfileImagesService = {
  uploadOwnProfileImageFile: jest.fn(),
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
const draftSessionId = '550e8400-e29b-41d4-a716-446655440000';

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
    app.useGlobalPipes(createAppValidationPipe());
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
    authenticatedUser.role = 'SUPERADMIN';
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/admin/lodging-image-uploads sube la imagen draft por backend', async () => {
    mockLodgingImagesService.uploadDraftImageFile.mockResolvedValue({
      imageId: 'image-1',
      uploadSessionId: draftSessionId,
      confirmed: true,
    });

    await request(app.getHttpServer())
      .post('/api/admin/lodging-image-uploads')
      .field('uploadSessionId', draftSessionId)
      .attach('file', Buffer.from('fake-image'), {
        filename: 'draft.png',
        contentType: 'image/png',
      })
      .expect(201)
      .expect({
        imageId: 'image-1',
        uploadSessionId: draftSessionId,
        confirmed: true,
      });

    expect(mockLodgingImagesService.uploadDraftImageFile).toHaveBeenCalledWith(
      {
        uploadSessionId: draftSessionId,
      },
      expect.objectContaining({
        mimetype: 'image/png',
      }),
      authenticatedUser.ownerId,
    );
  });

  it('POST /api/admin/lodging-image-uploads valida DTOs requeridos', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/lodging-image-uploads')
      .attach('file', Buffer.from('fake-image'), {
        filename: 'draft.png',
        contentType: 'image/png',
      })
      .expect(400)
      .expect({
        message: 'uploadSessionId must be a UUID',
        code: ERROR_CODES.REQUEST_VALIDATION_ERROR,
      });

    expect(
      mockLodgingImagesService.uploadDraftImageFile,
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
        uploadSessionId: draftSessionId,
        pendingImageIds: ['image-1'],
        targetOwnerId: '507f1f77bcf86cd799439099',
      })
      .expect(201);

    expect(mockLodgingsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        uploadSessionId: draftSessionId,
        pendingImageIds: ['image-1'],
        targetOwnerId: '507f1f77bcf86cd799439099',
      }),
      authenticatedUser.ownerId,
      authenticatedUser.role,
    );
  });

  it('POST /api/admin/lodgings rechaza targetOwnerId invalido por validacion global', async () => {
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
        targetOwnerId: 'invalid-owner-id',
      })
      .expect(400)
      .expect({
        message: 'targetOwnerId must be a mongodb id',
        code: ERROR_CODES.INVALID_TARGET_OWNER_ID,
      });

    expect(mockLodgingsService.create).not.toHaveBeenCalled();
  });

  it('POST /api/auth/me/profile-image usa el usuario autenticado', async () => {
    authenticatedUser.role = 'OWNER';
    mockUserProfileImagesService.uploadOwnProfileImageFile.mockResolvedValue({
      image: {
        imageId: 'profile-1',
      },
    });

    await request(app.getHttpServer())
      .post('/api/auth/me/profile-image')
      .attach('file', Buffer.from('profile-image'), {
        filename: 'profile.webp',
        contentType: 'image/webp',
      })
      .expect(201);

    expect(
      mockUserProfileImagesService.uploadOwnProfileImageFile,
    ).toHaveBeenCalledWith(
      authenticatedUser.ownerId,
      authenticatedUser.userId,
      expect.objectContaining({
        mimetype: 'image/webp',
      }),
    );
  });

  it('POST /api/auth/me/profile-image exige archivo', async () => {
    authenticatedUser.role = 'OWNER';
    mockUserProfileImagesService.uploadOwnProfileImageFile.mockRejectedValue(
      new DomainException(
        'Image file is required',
        ERROR_CODES.REQUEST_VALIDATION_ERROR,
        400,
      ),
    );

    await request(app.getHttpServer())
      .post('/api/auth/me/profile-image')
      .expect(400)
      .expect({
        message: 'Image file is required',
        code: ERROR_CODES.REQUEST_VALIDATION_ERROR,
      });

    expect(
      mockUserProfileImagesService.uploadOwnProfileImageFile,
    ).toHaveBeenCalledWith(
      authenticatedUser.ownerId,
      authenticatedUser.userId,
      undefined,
    );
  });

  it('DELETE /api/auth/me/profile-image elimina la imagen propia', async () => {
    authenticatedUser.role = 'OWNER';
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

  it('POST /api/auth/me/profile-image rechaza a SUPERADMIN aunque sea su propio usuario', async () => {
    authenticatedUser.role = 'SUPERADMIN';

    await request(app.getHttpServer())
      .post('/api/auth/me/profile-image')
      .attach('file', Buffer.from('profile-image'), {
        filename: 'profile.webp',
        contentType: 'image/webp',
      })
      .expect(403)
      .expect({
        message: 'SUPERADMIN cannot manage profile images',
        code: ERROR_CODES.PROFILE_IMAGE_FORBIDDEN_FOR_SUPERADMIN,
      });

    expect(
      mockUserProfileImagesService.uploadOwnProfileImageFile,
    ).not.toHaveBeenCalled();
  });
});
