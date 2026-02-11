import { Test, TestingModule } from '@nestjs/testing';
import { LodgingsService } from './lodgings.service';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { LodgingType } from './schemas/lodging.schema';
import { DomainException } from '@common/exceptions/domain.exception';

describe('LodgingsService', () => {
  let service: LodgingsService;

  const mockLodgingDocument = {
    _id: new Types.ObjectId(),
    title: 'Test',
    active: true,
  };

  // 👉 Mongoose Model = función constructora + métodos estáticos
  const lodgingModelMock: any = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue(mockLodgingDocument),
  }));

  lodgingModelMock.find = jest.fn();
  lodgingModelMock.findOne = jest.fn();
  lodgingModelMock.findOneAndUpdate = jest.fn();
  lodgingModelMock.countDocuments = jest.fn();

  const contactModelMock = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LodgingsService,
        {
          provide: getModelToken('Lodging'),
          useValue: lodgingModelMock,
        },
        {
          provide: getModelToken('Contact'),
          useValue: contactModelMock,
        },
      ],
    }).compile();

    service = module.get<LodgingsService>(LodgingsService);
  });

  describe('create', () => {
    it('crea lodging con contactId explícito', async () => {
      const contactId = new Types.ObjectId().toHexString();

      const result = await service.create({
        title: 'Test',
        description: 'Desc',
        location: 'Loc',
        type: LodgingType.CABIN,
        mainImage: 'https://img.com',
        contactId,
      });

      expect(result).toBeDefined();
    });

    it('usa contacto default si no viene contactId', async () => {
      contactModelMock.findOne.mockResolvedValue({
        _id: new Types.ObjectId(),
      });

      const result = await service.create({
        title: 'Test',
        description: 'Desc',
        location: 'Loc',
        type: LodgingType.CABIN,
        mainImage: 'https://img.com',
      });

      expect(contactModelMock.findOne).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('permite crear sin contacto si no hay default', async () => {
      contactModelMock.findOne.mockResolvedValue(null);

      const result = await service.create({
        title: 'Test',
        description: 'Desc',
        location: 'Loc',
        type: LodgingType.CABIN,
        mainImage: 'https://img.com',
      });

      expect(result).toBeDefined();
    });

    it('falla si from > to', async () => {
      await expect(
        service.create({
          title: 'Test',
          description: 'Desc',
          location: 'Loc',
          type: LodgingType.CABIN,
          mainImage: 'https://img.com',
          occupiedRanges: [{ from: '2026-02-10', to: '2026-02-01' }],
        }),
      ).rejects.toBeInstanceOf(DomainException);
    });
  });

  describe('findAll', () => {
    it('devuelve solo activos por defecto', async () => {
      lodgingModelMock.find.mockReturnValue({
        skip: () => ({
          limit: () => ({
            sort: jest.fn().mockResolvedValue([mockLodgingDocument]),
          }),
        }),
      });

      lodgingModelMock.countDocuments.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });

    it('incluye inactivos si includeInactive=true', async () => {
      lodgingModelMock.find.mockReturnValue({
        skip: () => ({
          limit: () => ({
            sort: jest.fn().mockResolvedValue([mockLodgingDocument]),
          }),
        }),
      });

      lodgingModelMock.countDocuments.mockResolvedValue(1);

      await service.findAll({ includeInactive: true });

      expect(lodgingModelMock.find).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('lanza NotFound con id inválido', async () => {
      await expect(service.findOne('invalid-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lanza NotFound si no existe', async () => {
      lodgingModelMock.findOne.mockResolvedValue(null);

      await expect(
        service.findOne(new Types.ObjectId().toHexString()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('devuelve lodging activo', async () => {
      lodgingModelMock.findOne.mockResolvedValue(mockLodgingDocument);

      const result = await service.findOne(new Types.ObjectId().toHexString());

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('actualiza parcialmente', async () => {
      lodgingModelMock.findOneAndUpdate.mockResolvedValue(mockLodgingDocument);

      const result = await service.update(new Types.ObjectId().toHexString(), {
        title: 'Nuevo',
      });

      expect(result).toBeDefined();
    });

    it('valida rangos si vienen', async () => {
      await expect(
        service.update(new Types.ObjectId().toHexString(), {
          occupiedRanges: [{ from: '2026-02-10', to: '2026-02-01' }],
        }),
      ).rejects.toBeInstanceOf(DomainException);
    });

    it('lanza NotFound si no existe', async () => {
      lodgingModelMock.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.update(new Types.ObjectId().toHexString(), {
          title: 'Test',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft deletea correctamente', async () => {
      lodgingModelMock.findOneAndUpdate.mockResolvedValue(mockLodgingDocument);

      const result = await service.remove(new Types.ObjectId().toHexString());

      expect(result).toBeDefined();
    });

    it('lanza NotFound si no existe', async () => {
      lodgingModelMock.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.remove(new Types.ObjectId().toHexString()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
