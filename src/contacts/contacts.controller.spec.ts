import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { Types } from 'mongoose';

describe('ContactsController', () => {
  let controller: ContactsController;
  let service: ContactsService;

  const serviceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockContact = {
    _id: new Types.ObjectId(),
    name: 'Contacto test',
    active: true,
    isDefault: false,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        {
          provide: ContactsService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<ContactsController>(ContactsController);
    service = module.get<ContactsService>(ContactsService);
  });

  describe('create', () => {
    it('llama al service.create con el dto', async () => {
      serviceMock.create.mockResolvedValue(mockContact);

      const dto = {
        name: 'Nuevo contacto',
        email: 'test@mail.com',
      };

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockContact);
    });
  });

  describe('findAll', () => {
    it('llama al service.findAll sin includeInactive', async () => {
      serviceMock.findAll.mockResolvedValue([mockContact]);

      const result = await controller.findAll(undefined);

      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([mockContact]);
    });

    it('llama al service.findAll con includeInactive=true', async () => {
      serviceMock.findAll.mockResolvedValue([mockContact]);

      const result = await controller.findAll(true);

      expect(service.findAll).toHaveBeenCalledWith(true);
      expect(result).toEqual([mockContact]);
    });
  });

  describe('findOne', () => {
    it('llama al service.findOne con id', async () => {
      serviceMock.findOne.mockResolvedValue(mockContact);

      const id = new Types.ObjectId().toHexString();

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockContact);
    });
  });

  describe('update', () => {
    it('llama al service.update con id y dto', async () => {
      serviceMock.update.mockResolvedValue(mockContact);

      const id = new Types.ObjectId().toHexString();
      const dto = { name: 'Nombre actualizado' };

      const result = await controller.update(id, dto);

      expect(service.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(mockContact);
    });
  });

  describe('remove', () => {
    it('llama al service.remove con id', async () => {
      serviceMock.remove.mockResolvedValue(mockContact);

      const id = new Types.ObjectId().toHexString();

      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockContact);
    });
  });
});
