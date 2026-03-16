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
          title: 'Centro de salud de cercania',
          category: 'healthcare',
          summary:
            'Referencia practica para ubicar rapido asistencia en el corredor sur y resolver una emergencia inicial.',
          googleMapsUrl:
            'https://www.google.com/maps/search/?api=1&query=Centro%20de%20salud%20cerca%20de%20Mar%20de%20las%20Pampas%20Buenos%20Aires',
          highlight: 'Atencion cercana',
          displayOrder: 1,
        },
        {
          id: 'police',
          title: 'Comisaria Tercera Mar de las Pampas',
          category: 'safety',
          summary:
            'Dependencia policial de referencia para Mar de las Pampas y las localidades del sur.',
          googleMapsUrl:
            'https://www.google.com/maps/search/?api=1&query=Comisaria%20Tercera%20Mar%20de%20las%20Pampas%20Buenos%20Aires',
          highlight: 'Seguridad',
          displayOrder: 2,
        },
        {
          id: 'downtown',
          title: 'Centro comercial de El Lucero',
          category: 'downtown',
          summary:
            'Corredor comercial principal del destino, con gastronomia, tiendas y movimiento peatonal.',
          googleMapsUrl:
            'https://www.google.com/maps/search/?api=1&query=El%20Lucero%20Mar%20de%20las%20Pampas%20Buenos%20Aires',
          highlight: 'Paseo y servicios',
          displayOrder: 3,
        },
        {
          id: 'pharmacy',
          title: 'Farmacia de Mar de las Pampas',
          category: 'pharmacy',
          summary:
            'Busqueda enfocada en farmacias del centro comercial para resolver compras esenciales.',
          googleMapsUrl:
            'https://www.google.com/maps/search/?api=1&query=Farmacia%20Mar%20de%20las%20Pampas%20Buenos%20Aires',
          highlight: 'Compras esenciales',
          displayOrder: 4,
        },
        {
          id: 'beach',
          title: 'Acceso de playa de Mar de las Pampas',
          category: 'beach',
          summary:
            'Punto de orientacion para bajar a la playa desde el bosque y el area comercial.',
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
