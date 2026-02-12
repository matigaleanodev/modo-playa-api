import { Test, TestingModule } from '@nestjs/testing';
import { LodgingsAdminController } from './lodgings.controller';
import { LodgingsService } from '../lodgings.service';
import { CreateLodgingDto } from '../dto/create-lodging.dto';
import { UpdateLodgingDto } from '../dto/update-lodging.dto';
import { AdminLodgingsQueryDto } from '@lodgings/dto/pagination-query.dto';

describe('LodgingsAdminController', () => {
  let controller: LodgingsAdminController;
  let service: LodgingsService;

  const mockService = {
    create: jest.fn(),
    findAdminPaginated: jest.fn(),
    findAdminById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockRequest = {
    user: {
      ownerId: 'owner1',
      role: 'OWNER',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LodgingsAdminController],
      providers: [
        {
          provide: LodgingsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<LodgingsAdminController>(LodgingsAdminController);
    service = module.get<LodgingsService>(LodgingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------
  // CREATE
  // -------------------------

  it('debe llamar a create con ownerId', async () => {
    const dto = {} as CreateLodgingDto;
    const expected = { _id: '1' };

    mockService.create.mockResolvedValue(expected);

    const result = await controller.create(dto, mockRequest);

    expect(service.create).toHaveBeenCalledWith(dto, mockRequest.user.ownerId);
    expect(result).toEqual(expected);
  });

  // -------------------------
  // FIND ALL
  // -------------------------

  it('debe llamar a findAdminPaginated con ownerId y role', async () => {
    const query = {} as AdminLodgingsQueryDto;
    const expected = { data: [], total: 0, page: 1, limit: 10 };

    mockService.findAdminPaginated.mockResolvedValue(expected);

    const result = await controller.findAll(query, mockRequest);

    expect(service.findAdminPaginated).toHaveBeenCalledWith(
      query,
      mockRequest.user.ownerId,
      mockRequest.user.role,
    );
    expect(result).toEqual(expected);
  });

  // -------------------------
  // FIND ONE
  // -------------------------

  it('debe llamar a findAdminById con ownerId y role', async () => {
    const expected = { _id: '1' };

    mockService.findAdminById.mockResolvedValue(expected);

    const result = await controller.findOne('1', mockRequest);

    expect(service.findAdminById).toHaveBeenCalledWith(
      '1',
      mockRequest.user.ownerId,
      mockRequest.user.role,
    );
    expect(result).toEqual(expected);
  });

  // -------------------------
  // UPDATE
  // -------------------------

  it('debe llamar a update con ownerId y role', async () => {
    const dto = {} as UpdateLodgingDto;
    const expected = { _id: '1' };

    mockService.update.mockResolvedValue(expected);

    const result = await controller.update('1', dto, mockRequest);

    expect(service.update).toHaveBeenCalledWith(
      '1',
      dto,
      mockRequest.user.ownerId,
      mockRequest.user.role,
    );
    expect(result).toEqual(expected);
  });

  // -------------------------
  // REMOVE
  // -------------------------

  it('debe llamar a remove con ownerId y role', async () => {
    const expected = { deleted: true };

    mockService.remove.mockResolvedValue(expected);

    const result = await controller.remove('1', mockRequest);

    expect(service.remove).toHaveBeenCalledWith(
      '1',
      mockRequest.user.ownerId,
      mockRequest.user.role,
    );
    expect(result).toEqual(expected);
  });
});
