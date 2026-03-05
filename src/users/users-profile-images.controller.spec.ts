import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { UsersProfileImagesController } from './users-profile-images.controller';
import { UserProfileImagesService } from '@users/services/user-profile-images.service';
import { RequestUser } from '@auth/interfaces/request-user.interface';

describe('UsersProfileImagesController', () => {
  let controller: UsersProfileImagesController;

  const mockService = {
    createUploadUrl: jest.fn(),
    uploadProfileImage: jest.fn(),
    confirmUpload: jest.fn(),
    deleteProfileImage: jest.fn(),
  };

  const mockUser: RequestUser = {
    userId: 'u1',
    ownerId: 'owner1',
    role: 'OWNER',
    purpose: 'ACCESS',
  };

  const mockRequest = {
    user: mockUser,
  } as Request & { user: RequestUser };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersProfileImagesController],
      providers: [
        {
          provide: UserProfileImagesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UsersProfileImagesController>(
      UsersProfileImagesController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe delegar createUploadUrl con ownerId del usuario autenticado', async () => {
    mockService.createUploadUrl.mockResolvedValue({ imageId: 'img1' });
    const dto = { mime: 'image/png', size: 123 };

    const result = await controller.createUploadUrl('u2', dto, mockRequest);

    expect(mockService.createUploadUrl).toHaveBeenCalledWith(
      mockUser.ownerId,
      'u2',
      dto,
    );
    expect(result).toEqual({ imageId: 'img1' });
  });

  it('debe delegar upload directo de perfil con ownerId del usuario autenticado', async () => {
    const file = { buffer: Buffer.from('x'), mimetype: 'image/png', size: 1 };
    mockService.uploadProfileImage.mockResolvedValue({
      image: { imageId: 'img1' },
    });

    const result = await controller.upload('u2', file, mockRequest);

    expect(mockService.uploadProfileImage).toHaveBeenCalledWith(
      mockUser.ownerId,
      'u2',
      file,
    );
    expect(result).toEqual({ image: { imageId: 'img1' } });
  });

  it('debe delegar confirmUpload con ownerId del usuario autenticado', async () => {
    const dto = { imageId: 'img1', key: 'users/u2/profile/img1/original.webp' };
    mockService.confirmUpload.mockResolvedValue({ image: { imageId: 'img1' } });

    const result = await controller.confirmUpload('u2', dto, mockRequest);

    expect(mockService.confirmUpload).toHaveBeenCalledWith(
      mockUser.ownerId,
      'u2',
      dto,
    );
    expect(result).toEqual({ image: { imageId: 'img1' } });
  });

  it('debe delegar deleteProfileImage con ownerId del usuario autenticado', async () => {
    mockService.deleteProfileImage.mockResolvedValue({ deleted: true });

    const result = await controller.deleteProfileImage('u2', mockRequest);

    expect(mockService.deleteProfileImage).toHaveBeenCalledWith(
      mockUser.ownerId,
      'u2',
    );
    expect(result).toEqual({ deleted: true });
  });
});
