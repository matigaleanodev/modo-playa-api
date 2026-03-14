import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { LodgingImagesAdminController } from './lodging-images-admin.controller';
import { LodgingImagesService } from '@lodgings/services/lodging-images.service';
import { RequestUser } from '@auth/interfaces/request-user.interface';

describe('LodgingImagesAdminController', () => {
  let controller: LodgingImagesAdminController;

  const mockLodgingImagesService = {
    createUploadUrl: jest.fn(),
    confirmUpload: jest.fn(),
    setDefaultImage: jest.fn(),
    deleteImage: jest.fn(),
  };

  const mockUser: RequestUser = {
    userId: 'user-1',
    ownerId: 'owner-1',
    role: 'SUPERADMIN',
    purpose: 'ACCESS',
  };

  const mockRequest = {
    user: mockUser,
  } as Request & { user: RequestUser };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LodgingImagesAdminController],
      providers: [
        {
          provide: LodgingImagesService,
          useValue: mockLodgingImagesService,
        },
      ],
    }).compile();

    controller = module.get<LodgingImagesAdminController>(
      LodgingImagesAdminController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe delegar createUploadUrl con ownerId y role del usuario autenticado', async () => {
    const dto = { mime: 'image/png', size: 1234 };
    mockLodgingImagesService.createUploadUrl.mockResolvedValue({
      imageId: 'img-1',
    });

    await controller.createUploadUrl('lodging-1', dto, mockRequest);

    expect(mockLodgingImagesService.createUploadUrl).toHaveBeenCalledWith(
      'lodging-1',
      dto,
      mockUser.ownerId,
      mockUser.role,
    );
  });

  it('debe delegar confirmUpload con ownerId y role del usuario autenticado', async () => {
    const dto = {
      imageId: 'img-1',
      key: 'lodgings/lodging-1/img-1/staging-upload',
    };
    mockLodgingImagesService.confirmUpload.mockResolvedValue({
      image: { imageId: 'img-1' },
    });

    await controller.confirmUpload('lodging-1', dto, mockRequest);

    expect(mockLodgingImagesService.confirmUpload).toHaveBeenCalledWith(
      'lodging-1',
      dto,
      mockUser.ownerId,
      mockUser.role,
    );
  });

  it('debe delegar setDefault con ownerId y role del usuario autenticado', async () => {
    mockLodgingImagesService.setDefaultImage.mockResolvedValue({
      images: [],
    });

    await controller.setDefault('lodging-1', 'img-1', mockRequest);

    expect(mockLodgingImagesService.setDefaultImage).toHaveBeenCalledWith(
      'lodging-1',
      'img-1',
      mockUser.ownerId,
      mockUser.role,
    );
  });

  it('debe delegar delete con ownerId y role del usuario autenticado', async () => {
    mockLodgingImagesService.deleteImage.mockResolvedValue({
      deleted: true,
      images: [],
    });

    await controller.delete('lodging-1', 'img-1', mockRequest);

    expect(mockLodgingImagesService.deleteImage).toHaveBeenCalledWith(
      'lodging-1',
      'img-1',
      mockUser.ownerId,
      mockUser.role,
    );
  });
});
