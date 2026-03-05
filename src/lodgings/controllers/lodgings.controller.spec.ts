import { Test, TestingModule } from '@nestjs/testing';
import { LodgingsAdminController } from './lodgings.controller';
import { LodgingsService } from '../lodgings.service';
import { CreateLodgingDto } from '../dto/create-lodging.dto';
import { UpdateLodgingDto } from '../dto/update-lodging.dto';
import { AdminLodgingsQueryDto } from '@lodgings/dto/pagination-query.dto';
import { Request } from 'express';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { MEDIA_URL_BUILDER } from '@media/constants/media.tokens';

describe('LodgingsAdminController', () => {
  let controller: LodgingsAdminController;

  const mockService = {
    create: jest.fn(),
    createWithImages: jest.fn(),
    findAdminPaginated: jest.fn(),
    findAdminById: jest.fn(),
    update: jest.fn(),
    updateWithImages: jest.fn(),
    getOccupiedRanges: jest.fn(),
    addOccupiedRange: jest.fn(),
    removeOccupiedRange: jest.fn(),
    remove: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LodgingsAdminController],
      providers: [
        {
          provide: LodgingsService,
          useValue: mockService,
        },
        {
          provide: MEDIA_URL_BUILDER,
          useValue: mockMediaUrlBuilder,
        },
      ],
    }).compile();

    controller = module.get<LodgingsAdminController>(LodgingsAdminController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe llamar a create con ownerId', async () => {
    const dto = {} as CreateLodgingDto;

    mockService.create.mockResolvedValue({
      _id: '1',
      title: 'Test',
      mainImage: 'lodgings/a/original.webp',
      images: ['lodgings/a/original.webp'],
    });

    const result = await controller.create(dto, mockRequest);

    expect(mockService.create).toHaveBeenCalledWith(dto, mockUser.ownerId);

    expect(result.id).toBe('1');
    expect(result.title).toBe('Test');
    expect(result.mainImage).toBe(
      'https://media.test/lodgings/a/original.webp',
    );
    expect(result.images).toEqual([
      'https://media.test/lodgings/a/original.webp',
    ]);
  });

  it('debe llamar a createWithImages con payload parseado, imágenes y owner/role', async () => {
    const body = {
      payload: JSON.stringify({
        title: 'Test',
        description: 'Desc',
        location: 'Loc',
        city: 'City',
        type: 'house',
        price: 100,
        priceUnit: 'night',
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        minNights: 2,
      }),
    };
    const files = [
      { buffer: Buffer.from('x'), mimetype: 'image/png', size: 1 },
    ];

    mockService.createWithImages.mockResolvedValue({
      _id: '1',
      title: 'Test',
      mainImage: 'lodgings/a/original.webp',
      images: [],
      mediaImages: [],
    });

    const result = await controller.createWithImages(body, files, mockRequest);

    expect(mockService.createWithImages).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test',
      }),
      files,
      mockUser.ownerId,
      mockUser.role,
    );
    expect(result.id).toBe('1');
  });

  it('debe llamar a findAdminPaginated con ownerId y role', async () => {
    const query = {} as AdminLodgingsQueryDto;

    mockService.findAdminPaginated.mockResolvedValue({
      data: [{ _id: '1', title: 'Test' }],
      total: 1,
      page: 1,
      limit: 10,
    });

    const result = await controller.findAll(query, mockRequest);

    expect(mockService.findAdminPaginated).toHaveBeenCalledWith(
      query,
      mockUser.ownerId,
      mockUser.role,
    );

    expect(result.data[0].id).toBe('1');
  });

  it('debe llamar a findAdminById con ownerId y role', async () => {
    mockService.findAdminById.mockResolvedValue({
      _id: '1',
      title: 'Test',
    });

    const result = await controller.findOne('1', mockRequest);

    expect(mockService.findAdminById).toHaveBeenCalledWith(
      '1',
      mockUser.ownerId,
      mockUser.role,
    );

    expect(result.id).toBe('1');
  });

  it('debe llamar a update con ownerId y role', async () => {
    const dto = {} as UpdateLodgingDto;

    mockService.update.mockResolvedValue({
      _id: '1',
      title: 'Updated',
    });

    const result = await controller.update('1', dto, mockRequest);

    expect(mockService.update).toHaveBeenCalledWith(
      '1',
      dto,
      mockUser.ownerId,
      mockUser.role,
    );

    expect(result.id).toBe('1');
    expect(result.title).toBe('Updated');
  });

  it('debe llamar a updateWithImages con payload parseado, imágenes y owner/role', async () => {
    const body = {
      payload: JSON.stringify({
        title: 'Updated',
      }),
    };
    const files = [
      { buffer: Buffer.from('x'), mimetype: 'image/png', size: 1 },
    ];

    mockService.updateWithImages.mockResolvedValue({
      _id: '1',
      title: 'Updated',
      mainImage: 'lodgings/a/original.webp',
      images: [],
      mediaImages: [],
    });

    const result = await controller.updateWithImages(
      '1',
      body,
      files,
      mockRequest,
    );

    expect(mockService.updateWithImages).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        title: 'Updated',
      }),
      files,
      mockUser.ownerId,
      mockUser.role,
    );
    expect(result.id).toBe('1');
  });

  it('debe llamar a remove con ownerId y role', async () => {
    mockService.remove.mockResolvedValue({ deleted: true });

    const result = await controller.remove('1', mockRequest);

    expect(mockService.remove).toHaveBeenCalledWith(
      '1',
      mockUser.ownerId,
      mockUser.role,
    );

    expect(result).toEqual({ deleted: true });
  });

  it('debe listar occupiedRanges con ownerId y role', async () => {
    const ranges = [{ from: '2026-01-10', to: '2026-01-15' }];
    mockService.getOccupiedRanges.mockResolvedValue(ranges);

    const result = await controller.getOccupiedRanges('1', mockRequest);

    expect(mockService.getOccupiedRanges).toHaveBeenCalledWith(
      '1',
      mockUser.ownerId,
      mockUser.role,
    );
    expect(result).toEqual(ranges);
  });

  it('debe agregar occupiedRange con ownerId y role', async () => {
    const dto = { from: '2026-01-10', to: '2026-01-15' };
    const ranges = [dto];
    mockService.addOccupiedRange.mockResolvedValue(ranges);

    const result = await controller.addOccupiedRange('1', dto, mockRequest);

    expect(mockService.addOccupiedRange).toHaveBeenCalledWith(
      '1',
      dto,
      mockUser.ownerId,
      mockUser.role,
    );
    expect(result).toEqual(ranges);
  });

  it('debe eliminar occupiedRange con ownerId y role', async () => {
    const dto = { from: '2026-01-10', to: '2026-01-15' };
    const ranges: (typeof dto)[] = [];
    mockService.removeOccupiedRange.mockResolvedValue(ranges);

    const result = await controller.removeOccupiedRange('1', dto, mockRequest);

    expect(mockService.removeOccupiedRange).toHaveBeenCalledWith(
      '1',
      dto,
      mockUser.ownerId,
      mockUser.role,
    );
    expect(result).toEqual(ranges);
  });
});
