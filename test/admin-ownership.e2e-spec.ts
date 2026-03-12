import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../src/auth/guard/auth.guard';
import { RequestUser } from '../src/auth/interfaces/request-user.interface';
import { ContactsController } from '../src/contacts/contacts.controller';
import { ContactsService } from '../src/contacts/contacts.service';
import { DashboardController } from '../src/dashboard/dashboard.controller';
import { DashboardService } from '../src/dashboard/dashboard.service';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';

const currentUser: RequestUser = {
  userId: '507f1f77bcf86cd799439012',
  ownerId: '507f1f77bcf86cd799439011',
  role: 'OWNER',
  purpose: 'ACCESS',
};

const mockContactsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockUsersService = {
  createUser: jest.fn(),
  findAllByScope: jest.fn(),
  findById: jest.fn(),
  updateUser: jest.fn(),
};

const mockDashboardService = {
  getSummary: jest.fn(),
};

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: RequestUser }>();
    request.user = currentUser;
    return true;
  }
}

@Module({
  controllers: [ContactsController, UsersController, DashboardController],
  providers: [
    {
      provide: ContactsService,
      useValue: mockContactsService,
    },
    {
      provide: UsersService,
      useValue: mockUsersService,
    },
    {
      provide: DashboardService,
      useValue: mockDashboardService,
    },
  ],
})
class TestAdminOwnershipModule {}

describe('Admin ownership rules (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAdminOwnershipModule],
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
    currentUser.userId = '507f1f77bcf86cd799439012';
    currentUser.ownerId = '507f1f77bcf86cd799439011';
    currentUser.role = 'OWNER';
    currentUser.purpose = 'ACCESS';
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/admin/contacts permite targetOwnerId cuando opera SUPERADMIN', async () => {
    currentUser.role = 'SUPERADMIN';
    mockContactsService.create.mockResolvedValue({
      _id: 'contact-1',
      name: 'Support Contact',
      isDefault: false,
      active: true,
    });

    await request(app.getHttpServer())
      .post('/api/admin/contacts')
      .send({
        name: 'Support Contact',
        targetOwnerId: '507f1f77bcf86cd799439099',
      })
      .expect(201)
      .expect({
        id: 'contact-1',
        name: 'Support Contact',
        isDefault: false,
        active: true,
      });

    expect(mockContactsService.create).toHaveBeenCalledWith(
      {
        name: 'Support Contact',
        targetOwnerId: '507f1f77bcf86cd799439099',
      },
      currentUser.ownerId,
      'SUPERADMIN',
    );
  });

  it('POST /api/admin/contacts rechaza targetOwnerId invalido', async () => {
    currentUser.role = 'SUPERADMIN';

    await request(app.getHttpServer())
      .post('/api/admin/contacts')
      .send({
        name: 'Support Contact',
        targetOwnerId: 'invalid-owner-id',
      })
      .expect(400);

    expect(mockContactsService.create).not.toHaveBeenCalled();
  });

  it('GET /api/admin/contacts delega includeInactive y role de SUPERADMIN', async () => {
    currentUser.role = 'SUPERADMIN';
    mockContactsService.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 2,
      limit: 20,
    });

    await request(app.getHttpServer())
      .get('/api/admin/contacts?includeInactive=true&page=2&limit=20')
      .expect(200)
      .expect({
        data: [],
        total: 0,
        page: 2,
        limit: 20,
      });

    expect(mockContactsService.findAll).toHaveBeenCalledWith(
      {
        includeInactive: true,
        page: 2,
        limit: 20,
      },
      currentUser.ownerId,
      'SUPERADMIN',
    );
  });

  it('POST /api/admin/users permite targetOwnerId cuando opera SUPERADMIN', async () => {
    currentUser.role = 'SUPERADMIN';
    mockUsersService.createUser.mockResolvedValue({
      _id: 'user-1',
      email: 'support@mail.com',
      username: 'support',
      isPasswordSet: false,
      isActive: true,
    });

    await request(app.getHttpServer())
      .post('/api/admin/users')
      .send({
        email: 'support@mail.com',
        username: 'support',
        targetOwnerId: '507f1f77bcf86cd799439099',
      })
      .expect(201)
      .expect({
        id: 'user-1',
        email: 'support@mail.com',
        username: 'support',
        isPasswordSet: false,
        isActive: true,
      });

    expect(mockUsersService.createUser).toHaveBeenCalledWith(
      currentUser.ownerId,
      'SUPERADMIN',
      {
        email: 'support@mail.com',
        username: 'support',
        targetOwnerId: '507f1f77bcf86cd799439099',
      },
    );
  });

  it('GET /api/admin/users delega el scope de SUPERADMIN al servicio', async () => {
    currentUser.role = 'SUPERADMIN';
    mockUsersService.findAllByScope.mockResolvedValue({
      data: [],
      total: 0,
      page: 2,
      limit: 5,
    });

    await request(app.getHttpServer())
      .get('/api/admin/users?page=2&limit=5')
      .expect(200)
      .expect({
        data: [],
        total: 0,
        page: 2,
        limit: 5,
      });

    expect(mockUsersService.findAllByScope).toHaveBeenCalledWith(
      currentUser.ownerId,
      'SUPERADMIN',
      {
        page: 2,
        limit: 5,
      },
    );
  });

  it('PATCH /api/admin/users/:id mantiene el role OWNER al actualizar', async () => {
    mockUsersService.updateUser.mockResolvedValue({
      _id: 'user-1',
      email: 'owner@mail.com',
      username: 'owner',
      isPasswordSet: true,
      isActive: true,
      firstName: 'Owner',
    });

    await request(app.getHttpServer())
      .patch('/api/admin/users/user-1')
      .send({
        firstName: 'Owner',
      })
      .expect(200)
      .expect({
        id: 'user-1',
        email: 'owner@mail.com',
        username: 'owner',
        isPasswordSet: true,
        isActive: true,
        firstName: 'Owner',
      });

    expect(mockUsersService.updateUser).toHaveBeenCalledWith(
      currentUser.ownerId,
      'user-1',
      {
        firstName: 'Owner',
      },
      'OWNER',
    );
  });

  it('GET /api/admin/dashboard/summary delega resumen global cuando opera SUPERADMIN', async () => {
    currentUser.role = 'SUPERADMIN';
    mockDashboardService.getSummary.mockResolvedValue({
      generatedAt: '2026-03-12T18:00:00.000Z',
      ownerScope: {
        ownerId: currentUser.ownerId,
        role: 'SUPERADMIN',
      },
      metrics: {
        lodgings: {
          total: 5,
          active: 4,
          inactive: 1,
          withAvailability: 3,
          withoutContact: 1,
        },
        contacts: {
          total: 2,
          active: 2,
          inactive: 0,
          defaults: 1,
          withEmail: 2,
          withWhatsapp: 1,
          incomplete: 0,
        },
        users: {
          total: 4,
          active: 4,
          inactive: 0,
          passwordSet: 3,
          pendingActivation: 1,
          neverLoggedIn: 1,
        },
      },
      distributions: {
        lodgingsByCity: [],
        lodgingsByType: [],
      },
      recentActivity: {
        items: [],
        source: 'none',
      },
      alerts: [],
    });

    await request(app.getHttpServer())
      .get('/api/admin/dashboard/summary')
      .expect(200)
      .expect((response) => {
        const body = response.body as {
          ownerScope: { role: 'OWNER' | 'SUPERADMIN' };
        };

        expect(body.ownerScope.role).toBe('SUPERADMIN');
      });

    expect(mockDashboardService.getSummary).toHaveBeenCalledWith(
      currentUser.ownerId,
      'SUPERADMIN',
    );
  });
});
