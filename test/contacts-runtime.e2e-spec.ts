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
import { ERROR_CODES } from '../src/common/constants/error-code';
import { ContactsController } from '../src/contacts/contacts.controller';
import { ContactsService } from '../src/contacts/contacts.service';
import { Contact } from '../src/contacts/schemas/contact.schema';

type ContactRecord = {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  email?: string;
  whatsapp?: string;
  isDefault: boolean;
  active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  set: (dto: Partial<ContactRecord>) => void;
  save: () => Promise<ContactRecord>;
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

class InMemoryContactModel {
  static records: ContactRecord[] = [];

  _doc: ContactRecord;

  constructor(data: Partial<ContactRecord>) {
    const record = InMemoryContactModel.buildRecord(data);
    this._doc = record;
  }

  static reset() {
    InMemoryContactModel.records = [];
  }

  static buildRecord(data: Partial<ContactRecord>): ContactRecord {
    const record: ContactRecord = {
      _id: data._id ?? new Types.ObjectId(),
      ownerId: data.ownerId ?? new Types.ObjectId(),
      name: data.name ?? '',
      email: data.email,
      whatsapp: data.whatsapp,
      isDefault: data.isDefault ?? false,
      active: data.active ?? true,
      notes: data.notes,
      createdAt: data.createdAt ?? new Date(),
      updatedAt: data.updatedAt ?? new Date(),
      set(dto: Partial<ContactRecord>) {
        Object.assign(record, dto);
        record.updatedAt = new Date();
      },
      save: () => {
        const index = InMemoryContactModel.records.findIndex((item) =>
          item._id.equals(record._id),
        );
        if (index === -1) {
          InMemoryContactModel.records.push(record);
        } else {
          InMemoryContactModel.records[index] = record;
        }
        return Promise.resolve(record);
      },
    };

    return record;
  }

  async save() {
    return this._doc.save();
  }

  static updateMany(
    filters: { ownerId: Types.ObjectId; isDefault?: boolean },
    update: { isDefault: boolean },
  ) {
    for (const record of InMemoryContactModel.records) {
      if (!record.ownerId.equals(filters.ownerId)) {
        continue;
      }
      if (
        filters.isDefault !== undefined &&
        record.isDefault !== filters.isDefault
      ) {
        continue;
      }
      record.isDefault = update.isDefault;
      record.updatedAt = new Date();
    }

    return Promise.resolve({ acknowledged: true });
  }

  static find(filters: { ownerId?: Types.ObjectId; active?: boolean }) {
    const filtered = InMemoryContactModel.records.filter((record) => {
      if (filters.ownerId && !record.ownerId.equals(filters.ownerId)) {
        return false;
      }
      if (
        filters.active !== undefined &&
        record.active !== Boolean(filters.active)
      ) {
        return false;
      }
      return true;
    });

    return {
      sort: () => ({
        skip: () => ({
          limit: () => ({
            exec: () =>
              Promise.resolve(
                [...filtered].sort(
                  (left, right) =>
                    right.createdAt.getTime() - left.createdAt.getTime(),
                ),
              ),
          }),
        }),
      }),
    };
  }

  static countDocuments(filters: {
    ownerId?: Types.ObjectId;
    active?: boolean;
  }) {
    const total = InMemoryContactModel.records.filter((record) => {
      if (filters.ownerId && !record.ownerId.equals(filters.ownerId)) {
        return false;
      }
      if (
        filters.active !== undefined &&
        record.active !== Boolean(filters.active)
      ) {
        return false;
      }
      return true;
    }).length;

    return {
      exec: () => Promise.resolve(total),
    };
  }

  static findOne(filters: {
    _id?: Types.ObjectId;
    ownerId?: Types.ObjectId;
    active?: boolean;
  }) {
    return Promise.resolve(
      InMemoryContactModel.records.find((record) => {
        if (filters._id && !record._id.equals(filters._id)) {
          return false;
        }
        if (filters.ownerId && !record.ownerId.equals(filters.ownerId)) {
          return false;
        }
        if (
          filters.active !== undefined &&
          record.active !== Boolean(filters.active)
        ) {
          return false;
        }
        return true;
      }) ?? null,
    );
  }
}

@Module({
  controllers: [ContactsController],
  providers: [
    ContactsService,
    {
      provide: getModelToken(Contact.name),
      useValue: InMemoryContactModel,
    },
  ],
})
class TestContactsRuntimeModule {}

describe('Contacts runtime flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestContactsRuntimeModule],
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
    InMemoryContactModel.reset();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('crea contacto default, lista y mantiene unicidad de default con services reales', async () => {
    const firstResponse = await request(app.getHttpServer())
      .post('/api/admin/contacts')
      .send({
        name: 'Primary Contact',
        email: 'primary@test.com',
        isDefault: true,
      })
      .expect(201);

    const secondResponse = await request(app.getHttpServer())
      .post('/api/admin/contacts')
      .send({
        name: 'Secondary Contact',
        whatsapp: '+5491111111111',
        isDefault: true,
      })
      .expect(201);

    const listResponse = await request(app.getHttpServer())
      .get('/api/admin/contacts?includeInactive=true')
      .expect(200);

    const firstBody = firstResponse.body as { id: string; isDefault: boolean };
    const secondBody = secondResponse.body as {
      id: string;
      isDefault: boolean;
    };
    const listBody = listResponse.body as {
      total: number;
      data: Array<{ id: string; isDefault: boolean }>;
    };

    expect(firstBody.isDefault).toBe(true);
    expect(secondBody.isDefault).toBe(true);
    expect(listBody.total).toBe(2);
    expect(
      listBody.data.filter((contact) => contact.isDefault === true),
    ).toHaveLength(1);
    expect(
      listBody.data.find((contact) => contact.id === secondBody.id)?.isDefault,
    ).toBe(true);
  });

  it('rechaza eliminar el contacto default con services reales', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/admin/contacts')
      .send({
        name: 'Default Contact',
        isDefault: true,
      })
      .expect(201);

    const body = created.body as { id: string };

    await request(app.getHttpServer())
      .delete(`/api/admin/contacts/${body.id}`)
      .expect(409)
      .expect({
        message:
          'Cannot remove default contact. Set another contact as default first.',
        code: ERROR_CODES.CONTACT_DEFAULT_DELETE_FORBIDDEN,
      });
  });
});
