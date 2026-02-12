import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './schemas/contact.schema';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { Request } from 'express';

describe('ContactsController', () => {
  let controller: ContactsController;
  let service: ContactsService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser: RequestUser = {
    userId: 'user1',
    ownerId: 'owner1',
    role: 'OWNER',
    purpose: 'ACCESS',
  };

  const mockRequest: Request & { user: RequestUser } = {
    user: mockUser,
  } as Request & { user: RequestUser };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        {
          provide: ContactsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ContactsController>(ContactsController);
    service = module.get<ContactsService>(ContactsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------
  // CREATE
  // -------------------------

  it('debe llamar a create con ownerId', async () => {
    const dto: CreateContactDto = { name: 'Test' };
    const expected: Contact = { name: 'Test' } as Contact;

    mockService.create.mockResolvedValue(expected);

    const result = await controller.create(dto, mockRequest);

    expect(service.create).toHaveBeenCalledWith(dto, mockUser.ownerId);
    expect(result).toEqual(expected);
  });

  // -------------------------
  // FIND ALL
  // -------------------------

  it('debe llamar a findAll con ownerId y role', async () => {
    const expected: Contact[] = [];

    mockService.findAll.mockResolvedValue(expected);

    const result = await controller.findAll(false, mockRequest);

    expect(service.findAll).toHaveBeenCalledWith(
      false,
      mockUser.ownerId,
      mockUser.role,
    );

    expect(result).toEqual(expected);
  });

  // -------------------------
  // FIND ONE
  // -------------------------

  it('debe llamar a findOne con parámetros correctos', async () => {
    const expected: Contact = { name: 'Test' } as Contact;

    mockService.findOne.mockResolvedValue(expected);

    const result = await controller.findOne('contactId', false, mockRequest);

    expect(service.findOne).toHaveBeenCalledWith(
      'contactId',
      false,
      mockUser.ownerId,
      mockUser.role,
    );

    expect(result).toEqual(expected);
  });

  // -------------------------
  // UPDATE
  // -------------------------

  it('debe llamar a update con ownerId y role', async () => {
    const dto: UpdateContactDto = { name: 'Updated' };
    const expected: Contact = { name: 'Updated' } as Contact;

    mockService.update.mockResolvedValue(expected);

    const result = await controller.update('contactId', dto, mockRequest);

    expect(service.update).toHaveBeenCalledWith(
      'contactId',
      dto,
      mockUser.ownerId,
      mockUser.role,
    );

    expect(result).toEqual(expected);
  });

  // -------------------------
  // REMOVE
  // -------------------------

  it('debe llamar a remove con ownerId y role', async () => {
    const expected = { deleted: true };

    mockService.remove.mockResolvedValue(expected);

    const result = await controller.remove('contactId', mockRequest);

    expect(service.remove).toHaveBeenCalledWith(
      'contactId',
      mockUser.ownerId,
      mockUser.role,
    );

    expect(result).toEqual(expected);
  });
});
