import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { DomainException } from '@common/exceptions/domain.exception';
import { Types } from 'mongoose';

type UserModelConstructor = {
  new (data: Partial<User>): {
    save: () => Promise<Partial<User>>;
  };
  findOne: jest.Mock;
  find: jest.Mock;
  findOneAndUpdate: jest.Mock;
  updateOne: jest.Mock;
  countDocuments: jest.Mock;
};

describe('UsersService', () => {
  let service: UsersService;
  let userModelMock: UserModelConstructor;

  const ownerId = new Types.ObjectId().toString();

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
        countDocuments: jest.fn(),
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------
  // CREATE
  // -------------------------

  it('debe crear usuario si no supera el límite', async () => {
    userModelMock.countDocuments.mockResolvedValue(1);
    userModelMock.findOne.mockResolvedValue(null);

    const result = await service.createUser(ownerId, 'OWNER', {
      email: 'test@mail.com',
      username: 'test',
    });

    expect(result).toBeDefined();
    expect(userModelMock).toHaveBeenCalled();
  });

  it('debe lanzar error si supera el límite de 3 usuarios', async () => {
    userModelMock.countDocuments.mockResolvedValue(3);

    await expect(
      service.createUser(ownerId, 'OWNER', {
        email: 'test@mail.com',
        username: 'test',
      }),
    ).rejects.toBeInstanceOf(DomainException);
  });

  it('SUPERADMIN puede crear sin límite', async () => {
    userModelMock.countDocuments.mockResolvedValue(10);
    userModelMock.findOne.mockResolvedValue(null);

    const result = await service.createUser(ownerId, 'SUPERADMIN', {
      email: 'admin@mail.com',
      username: 'admin',
    });

    expect(result).toBeDefined();
  });

  it('debe lanzar error si ya existe usuario con mismo email o username', async () => {
    userModelMock.countDocuments.mockResolvedValue(1);
    userModelMock.findOne.mockResolvedValue({});

    await expect(
      service.createUser(ownerId, 'OWNER', {
        email: 'test@mail.com',
        username: 'test',
      }),
    ).rejects.toBeInstanceOf(DomainException);
  });

  // -------------------------
  // FIND ALL
  // -------------------------

  it('debe devolver usuarios por owner', async () => {
    userModelMock.find.mockReturnValue({
      sort: () => ({
        exec: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await service.findAllByOwner(ownerId);

    expect(result).toEqual([]);
  });

  // -------------------------
  // FIND BY ID
  // -------------------------

  it('debe buscar usuario por id y owner', async () => {
    userModelMock.findOne.mockResolvedValue({ _id: 'id' });

    const result = await service.findById(
      ownerId,
      new Types.ObjectId().toString(),
    );

    expect(result).toBeDefined();
  });

  // -------------------------
  // UPDATE
  // -------------------------

  it('debe actualizar un usuario correctamente', async () => {
    userModelMock.findOneAndUpdate.mockResolvedValue({
      firstName: 'Juan',
    });

    const result = await service.updateUser(
      ownerId,
      new Types.ObjectId().toString(),
      {
        firstName: 'Juan',
      },
    );

    expect(result.firstName).toBe('Juan');
  });

  it('debe lanzar error si usuario no existe en update', async () => {
    userModelMock.findOneAndUpdate.mockResolvedValue(null);

    await expect(
      service.updateUser(ownerId, new Types.ObjectId().toString(), {}),
    ).rejects.toBeInstanceOf(DomainException);
  });

  // -------------------------
  // DEACTIVATE
  // -------------------------

  it('debe desactivar un usuario', async () => {
    userModelMock.updateOne.mockResolvedValue({ acknowledged: true });

    await service.deactivateUser(ownerId, new Types.ObjectId().toString());

    expect(userModelMock.updateOne).toHaveBeenCalled();
  });
});
