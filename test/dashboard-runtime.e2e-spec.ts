import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../src/auth/guard/auth.guard';
import { RequestUser } from '../src/auth/interfaces/request-user.interface';
import { DashboardController } from '../src/dashboard/dashboard.controller';
import { DashboardService } from '../src/dashboard/dashboard.service';
import { Lodging } from '../src/lodgings/schemas/lodging.schema';
import { Contact } from '../src/contacts/schemas/contact.schema';
import { User } from '../src/users/schemas/user.schema';

type LodgingRecord = {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  title: string;
  city: string;
  type: string;
  active: boolean;
  contactId?: Types.ObjectId;
  occupiedRanges?: unknown[];
  createdAt: Date;
  updatedAt: Date;
};

type ContactRecord = {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  email?: string;
  whatsapp?: string;
  isDefault: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type UserRecord = {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  email: string;
  username: string;
  isActive: boolean;
  isPasswordSet: boolean;
  lastLoginAt?: Date | null;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
};

const authenticatedUser: RequestUser = {
  userId: '507f1f77bcf86cd799439012',
  ownerId: '507f1f77bcf86cd799439011',
  role: 'OWNER',
  purpose: 'ACCESS',
};

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: RequestUser }>();
    request.user = authenticatedUser;
    return true;
  }
}

class InMemoryDashboardLodgingModel {
  static records: LodgingRecord[] = [];

  static reset() {
    InMemoryDashboardLodgingModel.records = [];
  }

  static aggregate(pipeline: Array<Record<string, unknown>>) {
    const match = (pipeline[0]?.$match ?? {}) as { ownerId?: Types.ObjectId };
    const scoped = InMemoryDashboardLodgingModel.records.filter((record) =>
      match.ownerId ? record.ownerId.equals(match.ownerId) : true,
    );

    return Promise.resolve([
      {
        totals: [
          {
            total: scoped.length,
            active: scoped.filter((record) => record.active).length,
            inactive: scoped.filter((record) => !record.active).length,
            withAvailability: scoped.filter(
              (record) => (record.occupiedRanges ?? []).length > 0,
            ).length,
            withoutContact: scoped.filter((record) => !record.contactId).length,
          },
        ],
        byCity: scoped.length
          ? [
              {
                city: scoped[0].city,
                total: scoped.length,
                active: scoped.filter((record) => record.active).length,
                inactive: scoped.filter((record) => !record.active).length,
              },
            ]
          : [],
        byType: scoped.length
          ? [{ type: scoped[0].type, total: scoped.length }]
          : [],
      },
    ]);
  }

  static find(filters: { ownerId?: Types.ObjectId }) {
    const scoped = InMemoryDashboardLodgingModel.records.filter((record) =>
      filters.ownerId ? record.ownerId.equals(filters.ownerId) : true,
    );

    return {
      sort: () => ({
        limit: () => ({
          lean: () => ({
            exec: () =>
              Promise.resolve(
                [...scoped].sort(
                  (left, right) =>
                    right.updatedAt.getTime() - left.updatedAt.getTime(),
                ),
              ),
          }),
        }),
      }),
    };
  }
}

class InMemoryDashboardContactModel {
  static records: ContactRecord[] = [];

  static reset() {
    InMemoryDashboardContactModel.records = [];
  }

  static aggregate(pipeline: Array<Record<string, unknown>>) {
    const match = (pipeline[0]?.$match ?? {}) as { ownerId?: Types.ObjectId };
    const scoped = InMemoryDashboardContactModel.records.filter((record) =>
      match.ownerId ? record.ownerId.equals(match.ownerId) : true,
    );

    return Promise.resolve([
      {
        total: scoped.length,
        active: scoped.filter((record) => record.active).length,
        inactive: scoped.filter((record) => !record.active).length,
        defaults: scoped.filter((record) => record.isDefault).length,
        withEmail: scoped.filter((record) => Boolean(record.email)).length,
        withWhatsapp: scoped.filter((record) => Boolean(record.whatsapp))
          .length,
        incomplete: scoped.filter((record) => !record.email && !record.whatsapp)
          .length,
      },
    ]);
  }

  static find(filters: { ownerId?: Types.ObjectId }) {
    const scoped = InMemoryDashboardContactModel.records.filter((record) =>
      filters.ownerId ? record.ownerId.equals(filters.ownerId) : true,
    );

    return {
      sort: () => ({
        limit: () => ({
          lean: () => ({
            exec: () =>
              Promise.resolve(
                [...scoped].sort(
                  (left, right) =>
                    right.updatedAt.getTime() - left.updatedAt.getTime(),
                ),
              ),
          }),
        }),
      }),
    };
  }
}

class InMemoryDashboardUserModel {
  static records: UserRecord[] = [];

  static reset() {
    InMemoryDashboardUserModel.records = [];
  }

  static aggregate(pipeline: Array<Record<string, unknown>>) {
    const match = (pipeline[0]?.$match ?? {}) as { ownerId?: Types.ObjectId };
    const scoped = InMemoryDashboardUserModel.records.filter((record) =>
      match.ownerId ? record.ownerId.equals(match.ownerId) : true,
    );

    return Promise.resolve([
      {
        total: scoped.length,
        active: scoped.filter((record) => record.isActive).length,
        inactive: scoped.filter((record) => !record.isActive).length,
        passwordSet: scoped.filter((record) => record.isPasswordSet).length,
        pendingActivation: scoped.filter((record) => !record.isPasswordSet)
          .length,
        neverLoggedIn: scoped.filter((record) => !record.lastLoginAt).length,
      },
    ]);
  }

  static find(filters: { ownerId?: Types.ObjectId }) {
    const scoped = InMemoryDashboardUserModel.records.filter((record) =>
      filters.ownerId ? record.ownerId.equals(filters.ownerId) : true,
    );

    return {
      sort: () => ({
        limit: () => ({
          lean: () => ({
            exec: () =>
              Promise.resolve(
                [...scoped].sort(
                  (left, right) =>
                    right.updatedAt.getTime() - left.updatedAt.getTime(),
                ),
              ),
          }),
        }),
      }),
    };
  }
}

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardService,
    {
      provide: getModelToken(Lodging.name),
      useValue: InMemoryDashboardLodgingModel,
    },
    {
      provide: getModelToken(Contact.name),
      useValue: InMemoryDashboardContactModel,
    },
    {
      provide: getModelToken(User.name),
      useValue: InMemoryDashboardUserModel,
    },
  ],
})
class TestDashboardRuntimeModule {}

describe('Dashboard runtime flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestDashboardRuntimeModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    InMemoryDashboardLodgingModel.reset();
    InMemoryDashboardContactModel.reset();
    InMemoryDashboardUserModel.reset();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('devuelve summary derivado con services reales', async () => {
    const ownerObjectId = new Types.ObjectId(authenticatedUser.ownerId);
    const contactId = new Types.ObjectId();
    const now = new Date('2026-03-12T12:00:00.000Z');

    InMemoryDashboardLodgingModel.records.push({
      _id: new Types.ObjectId(),
      ownerId: ownerObjectId,
      title: 'Cabin',
      city: 'Mar Azul',
      type: 'HOUSE',
      active: true,
      contactId,
      occupiedRanges: [{}],
      createdAt: new Date('2026-03-10T12:00:00.000Z'),
      updatedAt: now,
    });
    InMemoryDashboardContactModel.records.push({
      _id: contactId,
      ownerId: ownerObjectId,
      name: 'Support Contact',
      email: '',
      whatsapp: '',
      isDefault: true,
      active: true,
      createdAt: new Date('2026-03-09T12:00:00.000Z'),
      updatedAt: new Date('2026-03-11T12:00:00.000Z'),
    });
    InMemoryDashboardUserModel.records.push({
      _id: new Types.ObjectId(),
      ownerId: ownerObjectId,
      email: 'owner@modoplaya.app',
      username: 'owner',
      isActive: true,
      isPasswordSet: false,
      lastLoginAt: null,
      displayName: 'Owner User',
      createdAt: new Date('2026-03-08T12:00:00.000Z'),
      updatedAt: new Date('2026-03-12T11:00:00.000Z'),
    });

    const response = await request(app.getHttpServer())
      .get('/api/admin/dashboard/summary')
      .expect(200);

    const body = response.body as {
      ownerScope: { role: string; ownerId: string };
      metrics: {
        lodgings: { total: number; withAvailability: number };
        contacts: { incomplete: number };
        users: { pendingActivation: number };
      };
      recentActivity: { source: string; items: Array<{ kind: string }> };
      alerts: Array<{ code: string }>;
    };

    expect(body.ownerScope.ownerId).toBe(authenticatedUser.ownerId);
    expect(body.ownerScope.role).toBe('OWNER');
    expect(body.metrics.lodgings.total).toBe(1);
    expect(body.metrics.lodgings.withAvailability).toBe(1);
    expect(body.metrics.contacts.incomplete).toBe(1);
    expect(body.metrics.users.pendingActivation).toBe(1);
    expect(body.recentActivity.source).toBe('derived');
    expect(body.recentActivity.items.length).toBeGreaterThan(0);
    expect(body.alerts.map((alert) => alert.code)).toEqual(
      expect.arrayContaining(['CONTACT_INCOMPLETE', 'USER_PENDING_ACTIVATION']),
    );
  });
});
