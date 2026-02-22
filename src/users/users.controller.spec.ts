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

  const mockRequest = {
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

  it('debe delegar createUser con ownerId y role del JWT', async () => {
    const dto: CreateUserDto = {
      email: 'test@mail.com',
      username: 'test',
    };

    mockService.createUser.mockResolvedValue({
      _id: '1',
      email: dto.email,
      username: dto.username,
      isPasswordSet: false,
    });

    const result = await controller.createUser(dto, mockRequest);

    expect(mockService.createUser).toHaveBeenCalledWith(
      mockUser.ownerId,
      mockUser.role,
      dto,
    );

    expect(result.id).toBe('1');
    expect(result.email).toBe(dto.email);
  });

  it('debe delegar findAllByOwner con ownerId del JWT', async () => {
    const query = { page: 1, limit: 10 };
    mockService.findAllByOwner.mockResolvedValue({
      data: [
        {
          _id: '1',
          email: 'a@mail.com',
          username: 'a',
          isPasswordSet: true,
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    });

    const result = await controller.findAll(query, mockRequest);

    expect(mockService.findAllByOwner).toHaveBeenCalledWith(
      mockUser.ownerId,
      query,
    );

    expect(result.data[0].id).toBe('1');
    expect(result.total).toBe(1);
  });

  it('debe delegar findById con ownerId del JWT', async () => {
    mockService.findById.mockResolvedValue({
      _id: 'user-id',
      email: 'test@mail.com',
      username: 'test',
      isPasswordSet: true,
    });

    const result = await controller.findById('user-id', mockRequest);

    expect(mockService.findById).toHaveBeenCalledWith(
      mockUser.ownerId,
      'user-id',
    );

    expect(result.id).toBe('user-id');
  });

  it('debe delegar updateUser con ownerId del JWT', async () => {
    const dto: UpdateUserDto = {
      firstName: 'Juan',
    };

    mockService.updateUser.mockResolvedValue({
      _id: 'user-id',
      email: 'test@mail.com',
      username: 'test',
      firstName: 'Juan',
      isPasswordSet: true,
    });

    const result = await controller.updateUser('user-id', dto, mockRequest);

    expect(mockService.updateUser).toHaveBeenCalledWith(
      mockUser.ownerId,
      'user-id',
      dto,
    );

    expect(result.id).toBe('user-id');
    expect(result.firstName).toBe('Juan');
  });
});
