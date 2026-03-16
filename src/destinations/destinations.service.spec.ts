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
      pointsOfInterest: [
        {
          id: 'first-aid',
          title: 'Sala de primeros auxilios',
          category: 'healthcare',
          summary:
            'Referencia sanitaria mas cercana para atencion inicial en la zona.',
          googleMapsUrl:
            'https://www.google.com/maps/search/?api=1&query=Sala%20de%20primeros%20auxilios%20Mar%20de%20las%20Pampas%20Buenos%20Aires',
          highlight: 'Atencion inicial',
          displayOrder: 1,
        },
        {
          id: 'police',
          title: 'Policia',
          category: 'safety',
          summary:
            'Punto de apoyo para consultas de seguridad y asistencia policial.',
          googleMapsUrl:
            'https://www.google.com/maps/search/?api=1&query=Policia%20Mar%20de%20las%20Pampas%20Buenos%20Aires',
          highlight: 'Seguridad',
          displayOrder: 2,
        },
        {
          id: 'downtown',
          title: 'Centro de la ciudad',
          category: 'downtown',
          summary:
            'Area comercial principal con gastronomia, paseo y servicios.',
          googleMapsUrl:
            'https://www.google.com/maps/search/?api=1&query=Centro%20de%20Mar%20de%20las%20Pampas%20Buenos%20Aires',
          highlight: 'Paseo y servicios',
          displayOrder: 3,
        },
        {
          id: 'pharmacy',
          title: 'Farmacia',
          category: 'pharmacy',
          summary:
            'Acceso rapido a farmacias cercanas para necesidades basicas.',
          googleMapsUrl:
            'https://www.google.com/maps/search/?api=1&query=Farmacia%20Mar%20de%20las%20Pampas%20Buenos%20Aires',
          highlight: 'Compras esenciales',
          displayOrder: 4,
        },
        {
          id: 'beach',
          title: 'Acceso a la playa',
          category: 'beach',
          summary: 'Referencia para llegar a la playa desde el nucleo urbano.',
          googleMapsUrl:
            'https://www.google.com/maps/search/?api=1&query=Playa%20Mar%20de%20las%20Pampas%20Buenos%20Aires',
          highlight: 'Naturaleza',
          displayOrder: 5,
        },
      ],
    });
  });

  it('debe lanzar NotFoundException para destino inexistente', async () => {
    await expect(
      service.getContext('invalid-destination' as DestinationId),
    ).rejects.toThrow(NotFoundException);
  });
});
