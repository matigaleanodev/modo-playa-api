import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LodgingsService } from './lodgings.service';
import { Lodging, LodgingDocument } from './schemas/lodging.schema';
import { Contact } from '@contacts/schemas/contact.schema';
import { DomainException } from '@common/exceptions/domain.exception';
import { Types } from 'mongoose';
import { LodgingImagesService } from '@lodgings/services/lodging-images.service';
import { UpdateLodgingDto } from './dto/update-lodging.dto';

describe('LodgingsService', () => {
  let service: LodgingsService;
  let ownerId: string;
  let lodgingId: string;

  const mockLodgingModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockContactModel = {
    findOne: jest.fn(),
  };

  const mockLodgingImagesService = {
    attachUploadedFiles: jest.fn(),
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
        {
          provide: LodgingImagesService,
          useValue: mockLodgingImagesService,
        },
      ],
    }).compile();

    service = module.get<LodgingsService>(LodgingsService);
    mockLodgingImagesService.attachUploadedFiles.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const withPopulate = <T>(result: T) => ({
    populate: jest.fn().mockResolvedValue(result),
  });

  // -------------------------
  // findPublicById
  // -------------------------

  describe('findPublicById', () => {
    it('debe devolver lodging si existe y está activo', async () => {
      const lodging = { _id: '1', active: true };
      mockLodgingModel.findOne.mockReturnValue(withPopulate(lodging));

      const result = await service.findPublicById(lodgingId);

      expect(result).toEqual(lodging);
      expect(mockLodgingModel.findOne).toHaveBeenCalled();
    });

    it('debe lanzar DomainException si no existe', async () => {
      mockLodgingModel.findOne.mockReturnValue(withPopulate(null));

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
      mockLodgingModel.findOne.mockReturnValue(withPopulate(lodging));

      const result = await service.findAdminById(lodgingId, ownerId, 'OWNER');

      expect(result).toEqual(lodging);
    });

    it('lanza error si no existe', async () => {
      mockLodgingModel.findOne.mockReturnValue(withPopulate(null));

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
      mockLodgingModel.findOneAndUpdate.mockReturnValue(withPopulate(updated));

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
      const invalidUpdateDto = {
        occupiedRanges: [{ from: '2026-01-10', to: '2026-01-11' }],
      } as unknown as UpdateLodgingDto;

      await expect(
        service.update(lodgingId, invalidUpdateDto, ownerId, 'OWNER'),
      ).rejects.toThrow(DomainException);
    });
  });

  describe('createWithImages', () => {
    it('debe rechazar creación sin imagen principal ni archivos', async () => {
      await expect(
        service.createWithImages(
          {
            title: 'L',
            description: 'D',
            location: 'Loc',
            city: 'City',
            type: 'house',
            price: 10,
            priceUnit: 'night',
            maxGuests: 2,
            bedrooms: 1,
            bathrooms: 1,
            minNights: 1,
          },
          [],
          ownerId,
          'OWNER',
        ),
      ).rejects.toThrow(DomainException);
    });

    it('debe crear y devolver sin adjuntar archivos cuando no hay imágenes nuevas', async () => {
      const created = {
        _id: new Types.ObjectId(),
      } as unknown as LodgingDocument;
      const spyCreate = jest
        .spyOn(service, 'create')
        .mockResolvedValue(created);

      const result = await service.createWithImages(
        {
          title: 'L',
          description: 'D',
          location: 'Loc',
          city: 'City',
          type: 'house',
          price: 10,
          priceUnit: 'night',
          maxGuests: 2,
          bedrooms: 1,
          bathrooms: 1,
          minNights: 1,
          mainImage: 'https://img',
        },
        [],
        ownerId,
        'OWNER',
      );

      expect(spyCreate).toHaveBeenCalled();
      expect(
        mockLodgingImagesService.attachUploadedFiles,
      ).not.toHaveBeenCalled();
      expect(result).toBe(created);
    });

    it('debe hacer rollback del lodging si falla attachUploadedFiles', async () => {
      const created = {
        _id: new Types.ObjectId(),
      } as unknown as LodgingDocument;
      jest.spyOn(service, 'create').mockResolvedValue(created);
      mockLodgingImagesService.attachUploadedFiles.mockRejectedValue(
        new Error('boom'),
      );

      await expect(
        service.createWithImages(
          {
            title: 'L',
            description: 'D',
            location: 'Loc',
            city: 'City',
            type: 'house',
            price: 10,
            priceUnit: 'night',
            maxGuests: 2,
            bedrooms: 1,
            bathrooms: 1,
            minNights: 1,
          },
          [{ buffer: Buffer.from('x'), mimetype: 'image/png', size: 1 }],
          ownerId,
          'OWNER',
        ),
      ).rejects.toThrow('boom');

      expect(mockLodgingModel.deleteOne).toHaveBeenCalledWith({
        _id: created._id,
      });
    });
  });

  describe('updateWithImages', () => {
    it('debe actualizar y retornar findAdminById cuando no hay archivos nuevos', async () => {
      const updated = { _id: 'x' } as unknown as LodgingDocument;
      const spyUpdate = jest
        .spyOn(service, 'update')
        .mockResolvedValue(updated);
      const spyFind = jest
        .spyOn(service, 'findAdminById')
        .mockResolvedValue(updated);

      const result = await service.updateWithImages(
        lodgingId,
        { title: 'Nuevo' },
        [],
        ownerId,
        'OWNER',
      );

      expect(spyUpdate).toHaveBeenCalled();
      expect(
        mockLodgingImagesService.attachUploadedFiles,
      ).not.toHaveBeenCalled();
      expect(spyFind).toHaveBeenCalledWith(lodgingId, ownerId, 'OWNER');
      expect(result).toBe(updated);
    });

    it('debe adjuntar archivos nuevos tras actualizar', async () => {
      const updated = { _id: 'x' } as unknown as LodgingDocument;
      jest.spyOn(service, 'update').mockResolvedValue(updated);
      jest.spyOn(service, 'findAdminById').mockResolvedValue(updated);

      await service.updateWithImages(
        lodgingId,
        { title: 'Nuevo' },
        [{ buffer: Buffer.from('x'), mimetype: 'image/png', size: 1 }],
        ownerId,
        'OWNER',
      );

      expect(mockLodgingImagesService.attachUploadedFiles).toHaveBeenCalledWith(
        lodgingId,
        [{ buffer: Buffer.from('x'), mimetype: 'image/png', size: 1 }],
        ownerId,
        'OWNER',
      );
    });
  });

  describe('occupiedRanges availability', () => {
    it('debe devolver occupiedRanges normalizados', async () => {
      mockLodgingModel.findOne.mockReturnValue(
        withPopulate({
          occupiedRanges: [
            {
              from: new Date('2026-01-10T15:30:00.000Z'),
              to: new Date('2026-01-15T23:59:00.000Z'),
            },
          ],
        }),
      );

      const result = await service.getOccupiedRanges(
        lodgingId,
        ownerId,
        'OWNER',
      );

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
      mockLodgingModel.findOne.mockReturnValue(withPopulate(lodging));

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
      mockLodgingModel.findOne.mockReturnValue(withPopulate(lodging));

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
      mockLodgingModel.findOne.mockReturnValue(
        withPopulate({
          occupiedRanges: [
            { from: new Date('2026-01-10'), to: new Date('2026-01-15') },
          ],
        }),
      );

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
      mockLodgingModel.findOne.mockReturnValue(
        withPopulate({
          occupiedRanges: [
            { from: new Date('2026-01-10'), to: new Date('2026-01-15') },
          ],
        }),
      );

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
      mockLodgingModel.findOne.mockReturnValue(
        withPopulate({
          occupiedRanges: [],
        }),
      );

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
      mockLodgingModel.findOne.mockReturnValue(withPopulate(lodging));

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
      mockLodgingModel.findOne.mockReturnValue(
        withPopulate({
          occupiedRanges: [
            { from: new Date('2026-01-20'), to: new Date('2026-01-22') },
          ],
          save: jest.fn(),
        }),
      );

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
