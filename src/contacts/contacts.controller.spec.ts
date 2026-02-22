import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { Request } from 'express';

describe('ContactsController', () => {
  let controller: ContactsController;

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

  const mockRequest = {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe llamar a create con ownerId', async () => {
    const dto: CreateContactDto = { name: 'Test' };

    const mockContact = {
      _id: '1',
      name: 'Test',
    };

    mockService.create.mockResolvedValue(mockContact);

    const result = await controller.create(dto, mockRequest);

    expect(mockService.create).toHaveBeenCalledWith(dto, mockUser.ownerId);

    expect(result).toEqual({
      id: '1',
      name: 'Test',
      email: undefined,
      whatsapp: undefined,
      isDefault: undefined,
      active: undefined,
      notes: undefined,
    });
  });

  it('debe llamar a findAll con ownerId y role', async () => {
    const query = { page: 1, limit: 10, includeInactive: false };

    mockService.findAll.mockResolvedValue({
      data: [
        {
          _id: '1',
          name: 'Test',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    });

    const result = await controller.findAll(query, mockRequest);

    expect(mockService.findAll).toHaveBeenCalledWith(
      query,
      mockUser.ownerId,
      mockUser.role,
    );

    expect(result).toEqual({
      data: [
        {
          id: '1',
          name: 'Test',
          email: undefined,
          whatsapp: undefined,
          isDefault: undefined,
          active: undefined,
          notes: undefined,
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    });
  });

  it('debe llamar a findOne con parámetros correctos', async () => {
    const mockContact = {
      _id: '1',
      name: 'Test',
    };

    mockService.findOne.mockResolvedValue(mockContact);

    const result = await controller.findOne('contactId', false, mockRequest);

    expect(mockService.findOne).toHaveBeenCalledWith(
      'contactId',
      false,
      mockUser.ownerId,
      mockUser.role,
    );

    expect(result).toEqual({
      id: '1',
      name: 'Test',
      email: undefined,
      whatsapp: undefined,
      isDefault: undefined,
      active: undefined,
      notes: undefined,
    });
  });

  it('debe llamar a update con ownerId y role', async () => {
    const dto: UpdateContactDto = { name: 'Updated' };

    const mockContact = {
      _id: '1',
      name: 'Updated',
    };

    mockService.update.mockResolvedValue(mockContact);

    const result = await controller.update('contactId', dto, mockRequest);

    expect(mockService.update).toHaveBeenCalledWith(
      'contactId',
      dto,
      mockUser.ownerId,
      mockUser.role,
    );

    expect(result).toEqual({
      id: '1',
      name: 'Updated',
      email: undefined,
      whatsapp: undefined,
      isDefault: undefined,
      active: undefined,
      notes: undefined,
    });
  });

  it('debe llamar a remove con ownerId y role', async () => {
    const expected = { deleted: true };

    mockService.remove.mockResolvedValue(expected);

    const result = await controller.remove('contactId', mockRequest);

    expect(mockService.remove).toHaveBeenCalledWith(
      'contactId',
      mockUser.ownerId,
      mockUser.role,
    );

    expect(result).toEqual(expected);
  });
});
