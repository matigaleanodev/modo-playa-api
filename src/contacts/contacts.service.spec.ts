import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ContactsService } from './contacts.service';
import { Contact } from './schemas/contact.schema';
import { DomainException } from '@common/exceptions/domain.exception';
import { Types } from 'mongoose';

class FakeContactModel {
  static updateMany = jest.fn();
  static find = jest.fn();
  static findOne = jest.fn();

  private readonly data: unknown;

  constructor(data: unknown) {
    this.data = data;
  }

  save(): Promise<unknown> {
    return Promise.resolve(this.data);
  }
}

type UpdateManyFilters = {
  ownerId: Types.ObjectId;
  isDefault: boolean;
};

type FindFilters = {
  ownerId: Types.ObjectId;
};

describe('ContactsService', () => {
  let service: ContactsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: getModelToken(Contact.name),
          useValue: FakeContactModel,
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------
  // CREATE
  // -------------------------

  it('debe crear contacto sin default', async () => {
    const dto = { name: 'Test' };
    const ownerId = new Types.ObjectId().toString();

    const result = await service.create(dto, ownerId);

    expect(result).toMatchObject(dto);
    expect((result as { ownerId: Types.ObjectId }).ownerId).toBeInstanceOf(
      Types.ObjectId,
    );
    expect((result as { ownerId: Types.ObjectId }).ownerId.toString()).toBe(
      ownerId,
    );
  });

  it('debe desactivar default anterior si dto.isDefault es true', async () => {
    const dto = { name: 'Test', isDefault: true };
    const ownerId = new Types.ObjectId().toString();

    await service.create(dto, ownerId);

    expect(FakeContactModel.updateMany).toHaveBeenCalledTimes(1);
    const updateManyCalls = FakeContactModel.updateMany.mock
      .calls as unknown as Array<[UpdateManyFilters, { isDefault: boolean }]>;
    const [filters] = updateManyCalls[0];
    expect(filters.isDefault).toBe(true);
    expect(filters.ownerId.toString()).toBe(ownerId);
    expect(updateManyCalls[0][1]).toEqual({ isDefault: false });
  });

  // -------------------------
  // FIND ALL
  // -------------------------

  it('OWNER debe filtrar por ownerId', async () => {
    const ownerId = new Types.ObjectId().toString();
    const mockResult = [{ name: 'Contact' }];

    FakeContactModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockResult),
      }),
    });

    const result = await service.findAll(false, ownerId, 'OWNER');

    expect(result).toEqual(mockResult);
    expect(FakeContactModel.find).toHaveBeenCalled();
    const findCalls = FakeContactModel.find.mock.calls as unknown as Array<
      [FindFilters]
    >;
    const [filters] = findCalls[0];
    expect(filters.ownerId.toString()).toBe(ownerId);
  });

  // -------------------------
  // FIND ONE
  // -------------------------

  it('debe lanzar error si id inválido', async () => {
    await expect(
      service.findOne('invalid-id', false, 'owner', 'OWNER'),
    ).rejects.toThrow(DomainException);
  });

  it('debe devolver contacto si existe', async () => {
    const contact = { _id: new Types.ObjectId(), active: true };

    FakeContactModel.findOne.mockResolvedValue(contact);

    const result = await service.findOne(
      new Types.ObjectId().toString(),
      false,
      new Types.ObjectId().toString(),
      'OWNER',
    );

    expect(result).toEqual(contact);
  });

  // -------------------------
  // UPDATE
  // -------------------------

  it('debe lanzar error si contacto no existe', async () => {
    FakeContactModel.findOne.mockResolvedValue(null);

    await expect(
      service.update(
        new Types.ObjectId().toString(),
        {},
        new Types.ObjectId().toString(),
        'OWNER',
      ),
    ).rejects.toThrow(DomainException);
  });

  // -------------------------
  // REMOVE
  // -------------------------

  it('debe bloquear eliminación si es default', async () => {
    const contact = {
      _id: new Types.ObjectId(),
      isDefault: true,
    };

    FakeContactModel.findOne.mockResolvedValue(contact);

    await expect(
      service.remove(
        new Types.ObjectId().toString(),
        new Types.ObjectId().toString(),
        'OWNER',
      ),
    ).rejects.toThrow(DomainException);
  });

  it('debe hacer soft delete correctamente', async () => {
    const saveMock = jest.fn().mockResolvedValue(true);

    const contact = {
      _id: new Types.ObjectId(),
      isDefault: false,
      active: true,
      save: saveMock,
    };

    FakeContactModel.findOne.mockResolvedValue(contact);

    const result = await service.remove(
      new Types.ObjectId().toString(),
      new Types.ObjectId().toString(),
      'OWNER',
    );

    expect(contact.active).toBe(false);
    expect(result).toEqual({ deleted: true });
  });
});
