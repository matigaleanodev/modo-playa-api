import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { RequestUser } from '@auth/interfaces/request-user.interface';

describe('DashboardController', () => {
  let controller: DashboardController;

  const mockDashboardService = {
    getSummary: jest.fn(),
  };

  const mockUser: RequestUser = {
    userId: 'user-1',
    ownerId: '65f1c2d9a2b5c9f1a2b3c000',
    role: 'OWNER',
    purpose: 'ACCESS',
  };

  const mockRequest = {
    user: mockUser,
  } as Request & { user: RequestUser };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe delegar el summary con ownerId y role del JWT', async () => {
    mockDashboardService.getSummary.mockResolvedValue({
      generatedAt: '2026-02-23T15:00:00.000Z',
      ownerScope: { ownerId: mockUser.ownerId, role: mockUser.role },
      metrics: {
        lodgings: {
          total: 0,
          active: 0,
          inactive: 0,
          withAvailability: 0,
          withoutContact: 0,
        },
        contacts: {
          total: 0,
          active: 0,
          inactive: 0,
          defaults: 0,
          withEmail: 0,
          withWhatsapp: 0,
          incomplete: 0,
        },
        users: {
          total: 0,
          active: 0,
          inactive: 0,
          passwordSet: 0,
          pendingActivation: 0,
          neverLoggedIn: 0,
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

    const result = await controller.getSummary(mockRequest);

    expect(mockDashboardService.getSummary).toHaveBeenCalledWith(
      mockUser.ownerId,
      mockUser.role,
    );
    expect(result.ownerScope.ownerId).toBe(mockUser.ownerId);
  });
});
