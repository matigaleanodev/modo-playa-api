import { Test, TestingModule } from '@nestjs/testing';
import { LodgingsController } from './lodgings.controller';
import { LodgingsService } from './lodgings.service';
import { Types } from 'mongoose';

describe('LodgingsController', () => {
  let controller: LodgingsController;
  let service: LodgingsService;

  const serviceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockLodging = {
    _id: new Types.ObjectId(),
    title: 'Test lodging',
    active: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LodgingsController],
      providers: [
        {
          provide: LodgingsService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<LodgingsController>(LodgingsController);
    service = module.get<LodgingsService>(LodgingsService);
  });

  describe('create', () => {
    it('llama al service.create con el dto', async () => {
      serviceMock.create.mockResolvedValue(mockLodging);

      const dto = {
        title: 'Test',
        description: 'Desc',
        location: 'Loc',
        type: 'cabin',
        mainImage: 'https://img.com',
      };

      const result = await controller.create(dto as any);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockLodging);
    });
  });

  describe('findAll', () => {
    it('llama al service.findAll con query', async () => {
      const response = { data: [mockLodging], meta: {} };
      serviceMock.findAll.mockResolvedValue(response);

      const query = { page: 1, limit: 10 };

      const result = await controller.findAll(query as any);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(response);
    });
  });

  describe('findOne', () => {
    it('llama al service.findOne con id e includeInactive', async () => {
      serviceMock.findOne.mockResolvedValue(mockLodging);

      const id = new Types.ObjectId().toHexString();
      const query = { includeInactive: true };

      const result = await controller.findOne(id, query as any);

      expect(service.findOne).toHaveBeenCalledWith(id, true);
      expect(result).toEqual(mockLodging);
    });
  });

  describe('update', () => {
    it('llama al service.update con id, dto e includeInactive', async () => {
      serviceMock.update.mockResolvedValue(mockLodging);

      const id = new Types.ObjectId().toHexString();
      const dto = { title: 'Nuevo título' };
      const query = { includeInactive: false };

      const result = await controller.update(id, dto as any, query as any);

      expect(service.update).toHaveBeenCalledWith(id, dto, false);
      expect(result).toEqual(mockLodging);
    });
  });

  describe('remove', () => {
    it('llama al service.remove con id e includeInactive', async () => {
      serviceMock.remove.mockResolvedValue(mockLodging);

      const id = new Types.ObjectId().toHexString();
      const query = { includeInactive: true };

      const result = await controller.remove(id, query as any);

      expect(service.remove).toHaveBeenCalledWith(id, true);
      expect(result).toEqual(mockLodging);
    });
  });
});
