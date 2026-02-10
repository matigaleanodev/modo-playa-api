import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ERROR_CODES } from '@common/constants/error-code';

describe('ContactsService', () => {
  let service: ContactsService;

  const mockContactDocument = {
    _id: new Types.ObjectId(),
    name: 'Contacto test',
    active: true,
    isDefault: false,
    save: jest.fn(),
  };

  // Mongoose model mock
  const contactModelMock: any = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue(mockContactDocument),
  }));

  contactModelMock.find = jest.fn();
  contactModelMock.findOne = jest.fn();
  contactModelMock.findOneAndUpdate = jest.fn();
  contactModelMock.updateMany = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: getModelToken('Contact'),
          useValue: contactModelMock,
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
  });

  describe('create', () => {
    it('crea contacto sin tocar defaults', async () => {
      const result = await service.create({
        name: 'Test',
      });

      expect(result).toBeDefined();
      expect(contactModelMock.updateMany).not.toHaveBeenCalled();
    });

    it('desmarca default anterior si viene isDefault=true', async () => {
      await service.create({
        name: 'Test',
        isDefault: true,
      });

      expect(contactModelMock.updateMany).toHaveBeenCalledWith(
        { isDefault: true },
        { isDefault: false },
      );
    });
  });

  describe('findAll', () => {
    it('devuelve solo activos por defecto', async () => {
      contactModelMock.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockContactDocument]),
      });

      const result = await service.findAll();

      expect(contactModelMock.find).toHaveBeenCalledWith({ active: true });
      expect(result.length).toBe(1);
    });

    it('incluye inactivos si includeInactive=true', async () => {
      contactModelMock.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockContactDocument]),
      });

      await service.findAll(true);

      expect(contactModelMock.find).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('lanza NotFound si el id es inválido', async () => {
      await expect(service.findOne('invalid-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lanza NotFound si no existe', async () => {
      contactModelMock.findOne.mockResolvedValue(null);

      await expect(
        service.findOne(new Types.ObjectId().toHexString()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('devuelve contacto activo', async () => {
      contactModelMock.findOne.mockResolvedValue(mockContactDocument);

      const result = await service.findOne(new Types.ObjectId().toHexString());

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('actualiza contacto', async () => {
      contactModelMock.findOneAndUpdate.mockResolvedValue(mockContactDocument);

      const result = await service.update(new Types.ObjectId().toHexString(), {
        name: 'Nuevo nombre',
      });

      expect(result).toBeDefined();
    });

    it('desmarca default anterior si se setea isDefault', async () => {
      contactModelMock.findOneAndUpdate.mockResolvedValue(mockContactDocument);

      await service.update(new Types.ObjectId().toHexString(), {
        isDefault: true,
      });

      expect(contactModelMock.updateMany).toHaveBeenCalledWith(
        { isDefault: true },
        { isDefault: false },
      );
    });

    it('lanza NotFound si no existe', async () => {
      contactModelMock.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.update(new Types.ObjectId().toHexString(), {
          name: 'Test',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft deletea correctamente si no es default', async () => {
      const contact = {
        ...mockContactDocument,
        isDefault: false,
        save: jest.fn().mockResolvedValue(mockContactDocument),
      };

      contactModelMock.findOne.mockResolvedValue(contact);

      const result = await service.remove(new Types.ObjectId().toHexString());

      expect(result).toBeDefined();
      expect(contact.save).toHaveBeenCalled();
    });

    it('lanza DomainException si intenta eliminar default', async () => {
      const contact = {
        ...mockContactDocument,
        isDefault: true,
      };

      contactModelMock.findOne.mockResolvedValue(contact);

      await expect(
        service.remove(new Types.ObjectId().toHexString()),
      ).rejects.toMatchObject({
        response: {
          code: ERROR_CODES.CONTACT_DEFAULT_DELETE_FORBIDDEN,
        },
      });
    });

    it('lanza NotFound si no existe', async () => {
      contactModelMock.findOne.mockResolvedValue(null);

      await expect(
        service.remove(new Types.ObjectId().toHexString()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
