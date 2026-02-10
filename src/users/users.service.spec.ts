import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { DomainException } from '@common/exceptions/domain.exception';

type UserModelConstructor = {
  new (data: Partial<User>): {
    save: () => Promise<Partial<User>>;
  };
  findOne: jest.Mock;
  find: jest.Mock;
  findOneAndUpdate: jest.Mock;
  updateOne: jest.Mock;
};

describe('UsersService', () => {
  let service: UsersService;
  let userModelMock: UserModelConstructor;

  const ownerId = 'owner-id';

  beforeEach(async () => {
    userModelMock = Object.assign(
      jest.fn((data: Partial<User>) => ({
        ...data,
        save: jest.fn().mockResolvedValue(data),
      })),
      {
        findOne: jest.fn(),
        find: jest.fn(),
        findOneAndUpdate: jest.fn(),
        updateOne: jest.fn(),
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: userModelMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('debería crear un usuario correctamente', async () => {
    userModelMock.findOne.mockResolvedValue(null);

    const result = await service.createUser(ownerId, {
      email: 'test@mail.com',
      username: 'test',
    });

    expect(result).toBeDefined();
    expect(userModelMock).toHaveBeenCalled();
  });

  it('debería fallar si el usuario ya existe', async () => {
    userModelMock.findOne.mockResolvedValue({});

    await expect(
      service.createUser(ownerId, {
        email: 'test@mail.com',
        username: 'test',
      }),
    ).rejects.toBeInstanceOf(DomainException);
  });

  it('debería devolver usuarios por owner', async () => {
    userModelMock.find.mockReturnValue({
      sort: () => ({
        exec: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await service.findAllByOwner(ownerId);

    expect(result).toEqual([]);
  });

  it('debería buscar usuario por id y owner', async () => {
    userModelMock.findOne.mockResolvedValue({ _id: 'id' });

    const result = await service.findById(ownerId, 'id');

    expect(result).toBeDefined();
  });

  it('debería actualizar un usuario', async () => {
    userModelMock.findOneAndUpdate.mockResolvedValue({
      firstName: 'Juan',
    });

    const result = await service.updateUser(ownerId, 'id', {
      firstName: 'Juan',
    });

    expect(result?.firstName).toBe('Juan');
  });

  it('debería desactivar un usuario', async () => {
    userModelMock.updateOne.mockResolvedValue({ acknowledged: true });

    await service.deactivateUser(ownerId, 'id');

    expect(userModelMock.updateOne).toHaveBeenCalled();
  });
});
