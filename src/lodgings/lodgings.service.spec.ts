import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LodgingsService } from './lodgings.service';
import { Lodging } from './schemas/lodging.schema';
import { Contact } from '@contacts/schemas/contact.schema';
import { DomainException } from '@common/exceptions/domain.exception';
import { Types } from 'mongoose';

describe('LodgingsService', () => {
  let service: LodgingsService;
  let ownerId: string;
  let lodgingId: string;

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
    ownerId = new Types.ObjectId().toString();
    lodgingId = new Types.ObjectId().toString();

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

      const result = await service.findPublicById(lodgingId);

      expect(result).toEqual(lodging);
      expect(mockLodgingModel.findOne).toHaveBeenCalled();
    });

    it('debe lanzar DomainException si no existe', async () => {
      mockLodgingModel.findOne.mockResolvedValue(null);

      await expect(service.findPublicById(lodgingId)).rejects.toThrow(
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

      const result = await service.findAdminById(lodgingId, ownerId, 'OWNER');

      expect(result).toEqual(lodging);
    });

    it('lanza error si no existe', async () => {
      mockLodgingModel.findOne.mockResolvedValue(null);

      await expect(
        service.findAdminById(lodgingId, ownerId, 'OWNER'),
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
        ownerId,
        'OWNER',
      );

      expect(result).toEqual(updated);
    });

    it('debe lanzar error si id inválido', async () => {
      await expect(
        service.update('invalid-id', {}, ownerId, 'OWNER'),
      ).rejects.toThrow(DomainException);
    });

    it('debe rechazar occupiedRanges en patch general', async () => {
      await expect(
        service.update(
          lodgingId,
          { occupiedRanges: [{ from: '2026-01-10', to: '2026-01-11' }] } as any,
          ownerId,
          'OWNER',
        ),
      ).rejects.toThrow(DomainException);
    });
  });

  describe('occupiedRanges availability', () => {
    it('debe devolver occupiedRanges normalizados', async () => {
      mockLodgingModel.findOne.mockResolvedValue({
        occupiedRanges: [
          {
            from: new Date('2026-01-10T15:30:00.000Z'),
            to: new Date('2026-01-15T23:59:00.000Z'),
          },
        ],
      });

      const result = await service.getOccupiedRanges(lodgingId, ownerId, 'OWNER');

      expect(result).toEqual([{ from: '2026-01-10', to: '2026-01-15' }]);
    });

    it('debe agregar occupiedRange sin conflicto', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const lodging = {
        occupiedRanges: [
          { from: new Date('2026-01-01'), to: new Date('2026-01-03') },
        ],
        save: mockSave,
      };
      mockLodgingModel.findOne.mockResolvedValue(lodging);

      const result = await service.addOccupiedRange(
        lodgingId,
        { from: '2026-01-10', to: '2026-01-15' },
        ownerId,
        'OWNER',
      );

      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual([
        { from: '2026-01-01', to: '2026-01-03' },
        { from: '2026-01-10', to: '2026-01-15' },
      ]);
    });

    it('debe normalizar fechas al agregar occupiedRange', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const lodging = {
        occupiedRanges: [],
        save: mockSave,
      };
      mockLodgingModel.findOne.mockResolvedValue(lodging);

      const result = await service.addOccupiedRange(
        lodgingId,
        {
          from: '2026-01-10T22:20:00.000Z',
          to: '2026-01-11T05:10:00.000Z',
        },
        ownerId,
        'OWNER',
      );

      expect(mockSave).toHaveBeenCalled();
      expect(lodging.occupiedRanges).toEqual([
        {
          from: new Date('2026-01-10T00:00:00.000Z'),
          to: new Date('2026-01-11T00:00:00.000Z'),
        },
      ]);
      expect(result).toEqual([{ from: '2026-01-10', to: '2026-01-11' }]);
    });

    it('debe rechazar occupiedRange con conflicto', async () => {
      mockLodgingModel.findOne.mockResolvedValue({
        occupiedRanges: [
          { from: new Date('2026-01-10'), to: new Date('2026-01-15') },
        ],
      });

      await expect(
        service.addOccupiedRange(
          lodgingId,
          { from: '2026-01-14', to: '2026-01-20' },
          ownerId,
          'OWNER',
        ),
      ).rejects.toThrow(DomainException);
    });

    it('debe rechazar occupiedRange con conflicto en bordes inclusivos', async () => {
      mockLodgingModel.findOne.mockResolvedValue({
        occupiedRanges: [
          { from: new Date('2026-01-10'), to: new Date('2026-01-15') },
        ],
      });

      await expect(
        service.addOccupiedRange(
          lodgingId,
          { from: '2026-01-15', to: '2026-01-20' },
          ownerId,
          'OWNER',
        ),
      ).rejects.toThrow(DomainException);
    });

    it('debe rechazar occupiedRange con from mayor que to', async () => {
      mockLodgingModel.findOne.mockResolvedValue({
        occupiedRanges: [],
      });

      await expect(
        service.addOccupiedRange(
          lodgingId,
          { from: '2026-01-20', to: '2026-01-10' },
          ownerId,
          'OWNER',
        ),
      ).rejects.toThrow(DomainException);
    });

    it('debe eliminar occupiedRange existente', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const lodging = {
        occupiedRanges: [
          { from: new Date('2026-01-10'), to: new Date('2026-01-15') },
          { from: new Date('2026-01-20'), to: new Date('2026-01-22') },
        ],
        save: mockSave,
      };
      mockLodgingModel.findOne.mockResolvedValue(lodging);

      const result = await service.removeOccupiedRange(
        lodgingId,
        { from: '2026-01-10', to: '2026-01-15' },
        ownerId,
        'OWNER',
      );

      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual([{ from: '2026-01-20', to: '2026-01-22' }]);
    });

    it('debe rechazar eliminación de occupiedRange inexistente', async () => {
      mockLodgingModel.findOne.mockResolvedValue({
        occupiedRanges: [
          { from: new Date('2026-01-20'), to: new Date('2026-01-22') },
        ],
        save: jest.fn(),
      });

      await expect(
        service.removeOccupiedRange(
          lodgingId,
          { from: '2026-01-10', to: '2026-01-15' },
          ownerId,
          'OWNER',
        ),
      ).rejects.toThrow(DomainException);
    });
  });

  describe('remove', () => {
    it('debe hacer soft delete correctamente', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);

      mockLodgingModel.findOne.mockResolvedValue({
        _id: '1',
        active: true,
        save: mockSave,
      });

      const result = await service.remove(
        '507f1f77bcf86cd799439011',
        ownerId,
        'OWNER',
      );

      expect(mockLodgingModel.findOne).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });

    it('debe lanzar error si no existe', async () => {
      mockLodgingModel.findOne.mockResolvedValue(null);

      await expect(
        service.remove('507f1f77bcf86cd799439011', ownerId, 'OWNER'),
      ).rejects.toThrow(DomainException);
    });
  });
});
