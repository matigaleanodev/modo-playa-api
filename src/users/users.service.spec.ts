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

  it('SUPERADMIN puede crear en nombre de targetOwnerId', async () => {
    const targetOwnerId = new Types.ObjectId().toString();
    userModelMock.countDocuments.mockResolvedValue(10);
    userModelMock.findOne.mockResolvedValue(null);

    await service.createUser(ownerId, 'SUPERADMIN', {
      email: 'support@mail.com',
      username: 'support',
      targetOwnerId,
    });

    const constructorCalls = (
      userModelMock as unknown as {
        mock: { calls: Array<Array<unknown>> };
      }
    ).mock.calls;
    const constructorCall = constructorCalls[0][0] as {
      ownerId: Types.ObjectId;
    };

    expect(constructorCall.ownerId.toString()).toBe(targetOwnerId);
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

  it('debe devolver usuarios paginados por owner', async () => {
    userModelMock.find.mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });
    userModelMock.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });

    const result = await service.findAllByScope(ownerId, 'OWNER', {
      page: 1,
      limit: 10,
    });

    expect(result).toEqual({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    });
  });

  // -------------------------
  // FIND BY ID
  // -------------------------

  it('debe buscar usuario por id y owner', async () => {
    userModelMock.findOne.mockResolvedValue({ _id: 'id' });

    const result = await service.findById(
      ownerId,
      new Types.ObjectId().toString(),
      'OWNER',
    );

    expect(result).toBeDefined();
  });

  it('SUPERADMIN puede buscar por id sin filtro por ownerId', async () => {
    const userId = new Types.ObjectId().toString();
    userModelMock.findOne.mockResolvedValue({ _id: userId });

    await service.findById(ownerId, userId, 'SUPERADMIN');

    const findOneCalls = userModelMock.findOne.mock.calls as Array<[unknown]>;
    const filters = findOneCalls[0][0] as {
      _id: Types.ObjectId;
      ownerId?: Types.ObjectId;
    };

    expect(filters._id).toBeInstanceOf(Types.ObjectId);
    expect(filters.ownerId).toBeUndefined();
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
      'OWNER',
    );

    expect(result.firstName).toBe('Juan');
  });

  it('debe lanzar error si usuario no existe en update', async () => {
    userModelMock.findOneAndUpdate.mockResolvedValue(null);

    await expect(
      service.updateUser(ownerId, new Types.ObjectId().toString(), {}, 'OWNER'),
    ).rejects.toBeInstanceOf(DomainException);
  });

  it('SUPERADMIN puede actualizar sin filtro por ownerId', async () => {
    const userId = new Types.ObjectId().toString();
    userModelMock.findOneAndUpdate.mockResolvedValue({
      firstName: 'Support',
    });

    await service.updateUser(
      ownerId,
      userId,
      { firstName: 'Support' },
      'SUPERADMIN',
    );

    const findOneAndUpdateCalls = userModelMock.findOneAndUpdate.mock
      .calls as Array<[unknown, unknown, unknown]>;
    const filters = findOneAndUpdateCalls[0][0] as {
      _id: Types.ObjectId;
      ownerId?: Types.ObjectId;
    };
    const update = findOneAndUpdateCalls[0][1] as {
      $set: { firstName: string };
    };

    expect(filters._id).toBeInstanceOf(Types.ObjectId);
    expect(filters.ownerId).toBeUndefined();
    expect(update).toEqual({
      $set: { firstName: 'Support' },
    });
  });

  it('SUPERADMIN puede listar sin filtro por ownerId', async () => {
    userModelMock.find.mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });
    userModelMock.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });

    await service.findAllByScope(ownerId, 'SUPERADMIN', {
      page: 1,
      limit: 10,
    });

    expect(userModelMock.find).toHaveBeenCalledWith({});
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
