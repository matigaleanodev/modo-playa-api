import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LodgingsService } from './lodgings.service';
import { Lodging } from './schemas/lodging.schema';
import { Contact } from '@contacts/schemas/contact.schema';
import { DomainException } from '@common/exceptions/domain.exception';

describe('LodgingsService', () => {
  let service: LodgingsService;

  const mockLodgingModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockContactModel = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LodgingsService,
        {
          provide: getModelToken(Lodging.name),
          useValue: mockLodgingModel,
        },
        {
          provide: getModelToken(Contact.name),
          useValue: mockContactModel,
        },
      ],
    }).compile();

    service = module.get<LodgingsService>(LodgingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------
  // findPublicById
  // -------------------------

  describe('findPublicById', () => {
    it('debe devolver lodging si existe y está activo', async () => {
      const lodging = { _id: '1', active: true };
      mockLodgingModel.findOne.mockResolvedValue(lodging);

      const result = await service.findPublicById('1');

      expect(result).toEqual(lodging);
      expect(mockLodgingModel.findOne).toHaveBeenCalled();
    });

    it('debe lanzar DomainException si no existe', async () => {
      mockLodgingModel.findOne.mockResolvedValue(null);

      await expect(service.findPublicById('1')).rejects.toThrow(
        DomainException,
      );
    });
  });

  // -------------------------
  // findAdminById
  // -------------------------

  describe('findAdminById', () => {
    it('OWNER solo puede ver su lodging', async () => {
      const lodging = { _id: '1', ownerId: 'owner1' };
      mockLodgingModel.findOne.mockResolvedValue(lodging);

      const result = await service.findAdminById('1', 'owner1', 'OWNER');

      expect(result).toEqual(lodging);
    });

    it('lanza error si no existe', async () => {
      mockLodgingModel.findOne.mockResolvedValue(null);

      await expect(
        service.findAdminById('1', 'owner1', 'OWNER'),
      ).rejects.toThrow(DomainException);
    });
  });

  // -------------------------
  // update
  // -------------------------

  describe('update', () => {
    it('debe actualizar correctamente', async () => {
      const updated = { _id: '1', title: 'Nuevo título' };
      mockLodgingModel.findOneAndUpdate.mockResolvedValue(updated);

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        { title: 'Nuevo título' },
        'owner1',
        'OWNER',
      );

      expect(result).toEqual(updated);
    });

    it('debe lanzar error si id inválido', async () => {
      await expect(
        service.update('invalid-id', {}, 'owner1', 'OWNER'),
      ).rejects.toThrow(DomainException);
    });
  });

  // -------------------------
  // remove
  // -------------------------

  describe('remove', () => {
    it('debe eliminar correctamente', async () => {
      mockLodgingModel.findOneAndDelete.mockResolvedValue({ _id: '1' });

      const result = await service.remove(
        '507f1f77bcf86cd799439011',
        'owner1',
        'OWNER',
      );

      expect(result).toEqual({ deleted: true });
    });

    it('debe lanzar error si no existe', async () => {
      mockLodgingModel.findOneAndDelete.mockResolvedValue(null);

      await expect(
        service.remove('507f1f77bcf86cd799439011', 'owner1', 'OWNER'),
      ).rejects.toThrow(DomainException);
    });
  });
});
