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
          title: 'Clinica medica - Pediatria',
          category: 'healthcare',
          summary:
            'Clinica medica de referencia para consultas generales y pediatria en Mar de las Pampas.',
          googleMapsUrl:
            'https://www.google.com/maps/place/Cl%C3%ADnica+m%C3%A9dica+-+Pediatr%C3%ADa/@-37.3277167,-57.0214932,16.86z/data=!4m10!1m2!2m1!1sCentro+de+salud+cerca+de+Mar+de+las+Pampas+Buenos+Aires!3m6!1s0x959b5d89ccfddbf5:0x3bcdecdb61cdc1e4!8m2!3d-37.3263608!4d-57.0235063!15sCjdDZW50cm8gZGUgc2FsdWQgY2VyY2EgZGUgTWFyIGRlIGxhcyBQYW1wYXMgQnVlbm9zIEFpcmVzWjkiN2NlbnRybyBkZSBzYWx1ZCBjZXJjYSBkZSBtYXIgZGUgbGFzIHBhbXBhcyBidWVub3MgYWlyZXOSAQZkb2N0b3KaASNDaFpEU1VoTk1HOW5TMFZKUTBGblNVUm1iRXhVUlZSQkVBReABAPoBBAgAEDo!16s%2Fg%2F11frr1mf67?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D',
          highlight: 'Atencion medica',
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
          title: 'Centro Comercial de Mar de las Pampas',
          category: 'downtown',
          summary:
            'Nucleo comercial principal del destino, con gastronomia, tiendas y movimiento peatonal.',
          googleMapsUrl:
            'https://www.google.com/maps/place/Centro+Comercial+de+Mar+de+las+Pampas/@-37.3246593,-57.0236178,17z/data=!4m14!1m7!3m6!1s0x959b5dc1ae587b9b:0x6854898ced00154a!2sComisar%C3%ADa+Villa+Gesell+3%C2%B0+-+Mar+de+las+Pampas!8m2!3d-37.3172705!4d-57.0304735!16s%2Fg%2F11dflmr_56!3m5!1s0x959b5dce1e524e09:0x6552b4625743a489!8m2!3d-37.3257506!4d-57.022162!16s%2Fg%2F11clynsgyx?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D',
          highlight: 'Paseo y servicios',
          displayOrder: 3,
        },
        {
          id: 'pharmacy',
          title: 'Farmacia Pujol',
          category: 'pharmacy',
          summary:
            'Farmacia de referencia en Mar de las Pampas para compras esenciales y guardias cercanas.',
          googleMapsUrl:
            'https://www.google.com/maps/place/Farmacia+Pujol/@-37.3291654,-57.0223344,17.08z/data=!4m10!1m2!2m1!1sFarmacia+Mar+de+las+Pampas+Buenos+Aires!3m6!1s0x959b5dce24f7489d:0x2cf4490331347c29!8m2!3d-37.3257576!4d-57.0227451!15sCidGYXJtYWNpYSBNYXIgZGUgbGFzIFBhbXBhcyBCdWVub3MgQWlyZXNaKSInZmFybWFjaWEgbWFyIGRlIGxhcyBwYW1wYXMgYnVlbm9zIGFpcmVzkgEIcGhhcm1hY3maASNDaFpEU1VoTk1HOW5TMFZKUTBGblNVUkVkR05IV1VGM0VBReABAPoBBQiKAhBF!16s%2Fg%2F1hc3_mdt9?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D',
          highlight: 'Compras esenciales',
          displayOrder: 4,
        },
        {
          id: 'beach',
          title: 'Playa Mar de las Pampas',
          category: 'beach',
          summary:
            'Acceso recomendado para ubicar rapido la playa desde el bosque y el centro comercial.',
          googleMapsUrl:
            'https://www.google.com/maps/place/Playa+Mar+de+las+Pampas/@-37.3308372,-57.0191174,15z/data=!4m10!1m2!2m1!1sPlaya+Mar+de+las+Pampas+Buenos+Aires!3m6!1s0x959b5dd12edb36db:0x3c209cf45e96010!8m2!3d-37.3251268!4d-57.0159856!15sCiRQbGF5YSBNYXIgZGUgbGFzIFBhbXBhcyBCdWVub3MgQWlyZXNaJiIkcGxheWEgbWFyIGRlIGxhcyBwYW1wYXMgYnVlbm9zIGFpcmVzkgEMcHVibGljX2JlYWNomgEkQ2hkRFNVaE5NRzluUzBWSlEwRm5UVU5KTlU5WVF6TkJSUkFC4AEA-gEECAAQOg!16s%2Fg%2F11c5_l7xs3?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D',
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
