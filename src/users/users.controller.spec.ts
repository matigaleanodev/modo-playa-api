import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { Request } from 'express';

describe('UsersController', () => {
  let controller: UsersController;

  const mockService = {
    createUser: jest.fn(),
    findAllByOwner: jest.fn(),
    findById: jest.fn(),
    updateUser: jest.fn(),
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
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------
  // CREATE
  // -------------------------

  it('debe delegar createUser con ownerId y role del JWT', async () => {
    const dto: CreateUserDto = {
      email: 'test@mail.com',
      username: 'test',
    };

    const expected = { id: '1' };

    mockService.createUser.mockResolvedValue(expected);

    const result = await controller.createUser(dto, mockRequest);

    expect(mockService.createUser).toHaveBeenCalledWith(
      mockUser.ownerId,
      mockUser.role,
      dto,
    );

    expect(result).toEqual(expected);
  });

  // -------------------------
  // FIND ALL
  // -------------------------

  it('debe delegar findAllByOwner con ownerId del JWT', async () => {
    const expected = [];

    mockService.findAllByOwner.mockResolvedValue(expected);

    const result = await controller.findAll(mockRequest);

    expect(mockService.findAllByOwner).toHaveBeenCalledWith(mockUser.ownerId);

    expect(result).toEqual(expected);
  });

  // -------------------------
  // FIND BY ID
  // -------------------------

  it('debe delegar findById con ownerId del JWT', async () => {
    const expected = { id: 'user-id' };

    mockService.findById.mockResolvedValue(expected);

    const result = await controller.findById('user-id', mockRequest);

    expect(mockService.findById).toHaveBeenCalledWith(
      mockUser.ownerId,
      'user-id',
    );

    expect(result).toEqual(expected);
  });

  // -------------------------
  // UPDATE
  // -------------------------

  it('debe delegar updateUser con ownerId del JWT', async () => {
    const dto: UpdateUserDto = {
      firstName: 'Juan',
    };

    const expected = { firstName: 'Juan' };

    mockService.updateUser.mockResolvedValue(expected);

    const result = await controller.updateUser('user-id', dto, mockRequest);

    expect(mockService.updateUser).toHaveBeenCalledWith(
      mockUser.ownerId,
      'user-id',
      dto,
    );

    expect(result).toEqual(expected);
  });
});
