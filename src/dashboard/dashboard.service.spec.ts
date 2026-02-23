import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { DashboardService } from './dashboard.service';
import { Lodging } from '@lodgings/schemas/lodging.schema';
import { Contact } from '@contacts/schemas/contact.schema';
import { User } from '@users/schemas/user.schema';

const createQueryMock = <T>(result: T) => ({
  sort: jest.fn().mockReturnValue({
    limit: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(result),
      }),
    }),
  }),
});

describe('DashboardService', () => {
  let service: DashboardService;

  const lodgingModelMock = {
    aggregate: jest.fn(),
    find: jest.fn(),
  };

  const contactModelMock = {
    aggregate: jest.fn(),
    find: jest.fn(),
  };

  const userModelMock = {
    aggregate: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getModelToken(Lodging.name), useValue: lodgingModelMock },
        { provide: getModelToken(Contact.name), useValue: contactModelMock },
        { provide: getModelToken(User.name), useValue: userModelMock },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe aplicar filtro por ownerId para OWNER y construir métricas/alertas', async () => {
    const ownerId = new Types.ObjectId().toString();

    lodgingModelMock.aggregate.mockResolvedValueOnce([
      {
        totals: [
          {
            total: 2,
            active: 1,
            inactive: 1,
            withAvailability: 1,
            withoutContact: 1,
          },
        ],
        byCity: [{ city: 'Mar del Plata', total: 2, active: 1, inactive: 1 }],
        byType: [{ type: 'HOUSE', total: 2 }],
      },
    ]);
    contactModelMock.aggregate.mockResolvedValueOnce([
      {
        total: 1,
        active: 1,
        inactive: 0,
        defaults: 1,
        withEmail: 0,
        withWhatsapp: 0,
        incomplete: 1,
      },
    ]);
    userModelMock.aggregate.mockResolvedValueOnce([
      {
        total: 1,
        active: 1,
        inactive: 0,
        passwordSet: 0,
        pendingActivation: 1,
        neverLoggedIn: 1,
      },
    ]);

    const now = new Date('2026-02-23T12:00:00.000Z');
    lodgingModelMock.find.mockReturnValue(
      createQueryMock([
        {
          _id: new Types.ObjectId(),
          title: 'Casa test',
          createdAt: new Date('2026-02-20T12:00:00.000Z'),
          updatedAt: now,
        },
      ]),
    );
    contactModelMock.find.mockReturnValue(createQueryMock([]));
    userModelMock.find.mockReturnValue(createQueryMock([]));

    const result = await service.getSummary(ownerId, 'OWNER');

    const lodgingPipeline = lodgingModelMock.aggregate.mock.calls[0][0];
    const contactPipeline = contactModelMock.aggregate.mock.calls[0][0];
    const userPipeline = userModelMock.aggregate.mock.calls[0][0];

    expect(lodgingPipeline[0].$match.ownerId.toString()).toBe(ownerId);
    expect(contactPipeline[0].$match.ownerId.toString()).toBe(ownerId);
    expect(userPipeline[0].$match.ownerId.toString()).toBe(ownerId);

    expect(result.metrics.lodgings.total).toBe(2);
    expect(result.metrics.contacts.incomplete).toBe(1);
    expect(result.metrics.users.pendingActivation).toBe(1);
    expect(result.distributions.lodgingsByCity).toHaveLength(1);
    expect(result.recentActivity.source).toBe('derived');
    expect(result.alerts.map((a) => a.code)).toEqual(
      expect.arrayContaining([
        'LODGING_WITHOUT_CONTACT',
        'CONTACT_INCOMPLETE',
        'USER_PENDING_ACTIVATION',
        'INACTIVE_LODGINGS_PRESENT',
      ]),
    );
  });

  it('debe omitir filtro ownerId para SUPERADMIN', async () => {
    const ownerId = new Types.ObjectId().toString();

    lodgingModelMock.aggregate.mockResolvedValueOnce([
      { totals: [], byCity: [], byType: [] },
    ]);
    contactModelMock.aggregate.mockResolvedValueOnce([]);
    userModelMock.aggregate.mockResolvedValueOnce([]);
    lodgingModelMock.find.mockReturnValue(createQueryMock([]));
    contactModelMock.find.mockReturnValue(createQueryMock([]));
    userModelMock.find.mockReturnValue(createQueryMock([]));

    const result = await service.getSummary(ownerId, 'SUPERADMIN');

    expect(lodgingModelMock.aggregate.mock.calls[0][0][0].$match).toEqual({});
    expect(contactModelMock.aggregate.mock.calls[0][0][0].$match).toEqual({});
    expect(userModelMock.aggregate.mock.calls[0][0][0].$match).toEqual({});
    expect(result.ownerScope.role).toBe('SUPERADMIN');
    expect(result.recentActivity.source).toBe('none');
  });
});
