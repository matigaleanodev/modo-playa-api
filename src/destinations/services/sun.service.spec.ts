import { HttpService } from '@nestjs/axios';
import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { DestinationConfig } from '../interfaces/destination.interface';
import { DestinationId } from '../providers/destination-id.enum';
import { SunService } from './sun.service';

describe('SunService', () => {
  let service: SunService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const destination: DestinationConfig = {
    id: DestinationId.GESELL,
    name: 'Villa Gesell',
    latitude: -37.2639,
    longitude: -56.973,
    timezone: 'UTC',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SunService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<SunService>(SunService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe mapear sunrise y sunset en formato HH:mm', async () => {
    mockHttpService.get.mockReturnValue(
      of({
        data: {
          status: 'OK',
          results: {
            sunrise: '2026-03-04T06:12:00+00:00',
            sunset: '2026-03-04T20:05:00+00:00',
          },
        },
      }),
    );

    const result = await service.getContext(destination);

    expect(result).toEqual({
      sunrise: '06:12',
      sunset: '20:05',
    });
  });

  it('debe lanzar ServiceUnavailableException si la respuesta no es OK', async () => {
    mockHttpService.get.mockReturnValue(
      of({
        data: {
          status: 'INVALID_REQUEST',
          results: {},
        },
      }),
    );

    await expect(service.getContext(destination)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('debe lanzar ServiceUnavailableException si falla el proveedor externo', async () => {
    mockHttpService.get.mockReturnValue(
      throwError(() => new Error('network error')),
    );

    await expect(service.getContext(destination)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
