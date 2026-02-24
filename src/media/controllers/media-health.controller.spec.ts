import { Test, TestingModule } from '@nestjs/testing';
import { MediaHealthController } from './media-health.controller';
import { R2HealthService } from '@media/services/r2-health.service';

describe('MediaHealthController', () => {
  let controller: MediaHealthController;

  const mockR2HealthService = {
    testConnection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaHealthController],
      providers: [
        {
          provide: R2HealthService,
          useValue: mockR2HealthService,
        },
      ],
    }).compile();

    controller = module.get<MediaHealthController>(MediaHealthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe delegar el health check en R2HealthService', async () => {
    mockR2HealthService.testConnection.mockResolvedValue({
      ok: true,
      message: 'R2 connection successful',
    });

    const result = await controller.testConnection();

    expect(mockR2HealthService.testConnection).toHaveBeenCalled();
    expect(result).toEqual({
      ok: true,
      message: 'R2 connection successful',
    });
  });
});
