import { HttpService } from '@nestjs/axios';
import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { DestinationConfig } from '../interfaces/destination.interface';
import { DestinationId } from '../providers/destination-id.enum';
import { WeatherService } from './weather.service';

describe('WeatherService', () => {
  let service: WeatherService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const destination: DestinationConfig = {
    id: DestinationId.PAMPAS,
    name: 'Mar de las Pampas',
    latitude: -37.325,
    longitude: -57.025,
    timezone: 'America/Argentina/Buenos_Aires',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe mapear clima y pronóstico de Open-Meteo', async () => {
    mockHttpService.get.mockReturnValue(
      of({
        data: {
          current_weather: {
            temperature: 26.7,
            wind_speed: 14.2,
            weathercode: 3,
          },
          daily: {
            temperature_2m_max: [28.4, 27.1],
            temperature_2m_min: [19.3, 18.2],
          },
        },
      }),
    );

    const result = await service.getContext(destination);

    expect(result).toEqual({
      weather: {
        temperature: 27,
        windSpeed: 14,
        weatherCode: 3,
      },
      forecast: [
        { day: 'today', max: 28, min: 19 },
        { day: 'tomorrow', max: 27, min: 18 },
      ],
    });
  });

  it('debe reutilizar cache y evitar llamada externa dentro del TTL', async () => {
    mockHttpService.get.mockReturnValue(
      of({
        data: {
          current_weather: {
            temperature: 25,
            wind_speed: 10,
            weathercode: 2,
          },
          daily: {
            temperature_2m_max: [26, 27],
            temperature_2m_min: [18, 19],
          },
        },
      }),
    );

    const first = await service.getContext(destination);
    const second = await service.getContext(destination);

    expect(mockHttpService.get).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it('debe lanzar ServiceUnavailableException si la respuesta es incompleta', async () => {
    mockHttpService.get.mockReturnValue(
      of({
        data: {
          current_weather: {
            temperature: 20,
            wind_speed: 5,
          },
          daily: {
            temperature_2m_max: [24],
            temperature_2m_min: [16],
          },
        },
      }),
    );

    await expect(service.getContext(destination)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('debe lanzar ServiceUnavailableException si falla el proveedor externo', async () => {
    mockHttpService.get.mockReturnValue(
      throwError(() => new Error('timeout')),
    );

    await expect(service.getContext(destination)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
