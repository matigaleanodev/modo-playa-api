import { Test, TestingModule } from '@nestjs/testing';
import { DestinationsController } from './destinations.controller';
import { DestinationsService } from './destinations.service';
import { DestinationId } from './providers/destination-id.enum';

describe('DestinationsController', () => {
  let controller: DestinationsController;

  const mockDestinationsService = {
    getAll: jest.fn(),
    getContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DestinationsController],
      providers: [
        {
          provide: DestinationsService,
          useValue: mockDestinationsService,
        },
      ],
    }).compile();

    controller = module.get<DestinationsController>(DestinationsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe devolver lista de destinos disponibles', () => {
    const expected = [
      { id: DestinationId.GESELL, name: 'Villa Gesell' },
      { id: DestinationId.PAMPAS, name: 'Mar de las Pampas' },
    ];

    mockDestinationsService.getAll.mockReturnValue(expected);

    const result = controller.getAll();

    expect(mockDestinationsService.getAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expected);
  });

  it('debe delegar getContext con el id de destino', async () => {
    const expected = {
      destination: 'Mar de las Pampas',
      weather: { temperature: 27, windSpeed: 14, weatherCode: 3 },
      forecast: [
        { day: 'today', max: 28, min: 19 },
        { day: 'tomorrow', max: 27, min: 18 },
      ],
      sun: { sunrise: '06:12', sunset: '20:05' },
    };

    mockDestinationsService.getContext.mockResolvedValue(expected);

    const result = await controller.getContext({ id: DestinationId.PAMPAS });

    expect(mockDestinationsService.getContext).toHaveBeenCalledWith(
      DestinationId.PAMPAS,
    );
    expect(result).toEqual(expected);
  });
});
