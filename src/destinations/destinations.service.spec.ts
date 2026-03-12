import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DestinationsService } from './destinations.service';
import { SunService } from './services/sun.service';
import { WeatherService } from './services/weather.service';
import { DestinationId } from './providers/destination-id.enum';

describe('DestinationsService', () => {
  let service: DestinationsService;

  const mockWeatherService = {
    getContext: jest.fn(),
  };

  const mockSunService = {
    getContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DestinationsService,
        {
          provide: WeatherService,
          useValue: mockWeatherService,
        },
        {
          provide: SunService,
          useValue: mockSunService,
        },
      ],
    }).compile();

    service = module.get<DestinationsService>(DestinationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe listar destinos disponibles', () => {
    const result = service.getAll();

    expect(result).toEqual([
      { id: DestinationId.GESELL, name: 'Villa Gesell' },
      { id: DestinationId.PAMPAS, name: 'Mar de las Pampas' },
      { id: DestinationId.MAR_AZUL, name: 'Mar Azul' },
    ]);
  });

  it('debe devolver contexto completo para un destino', async () => {
    mockWeatherService.getContext.mockResolvedValue({
      weather: { temperature: 27, windSpeed: 14, weatherCode: 3 },
      forecast: [
        { day: 'today', max: 28, min: 19 },
        { day: 'tomorrow', max: 27, min: 18 },
      ],
    });
    mockSunService.getContext.mockResolvedValue({
      sunrise: '06:12',
      sunset: '20:05',
    });

    const result = await service.getContext(DestinationId.PAMPAS);

    expect(mockWeatherService.getContext).toHaveBeenCalledTimes(1);
    expect(mockSunService.getContext).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      destinationId: DestinationId.PAMPAS,
      destination: 'Mar de las Pampas',
      timezone: 'America/Argentina/Buenos_Aires',
      weather: { temperature: 27, windSpeed: 14, weatherCode: 3 },
      forecast: [
        { day: 'today', max: 28, min: 19 },
        { day: 'tomorrow', max: 27, min: 18 },
      ],
      sun: { sunrise: '06:12', sunset: '20:05' },
    });
  });

  it('debe lanzar NotFoundException para destino inexistente', async () => {
    await expect(
      service.getContext('invalid-destination' as DestinationId),
    ).rejects.toThrow(NotFoundException);
  });
});
