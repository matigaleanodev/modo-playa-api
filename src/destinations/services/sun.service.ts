import { HttpService } from '@nestjs/axios';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { DestinationConfig } from '../interfaces/destination.interface';
import {
  SunContext,
  SunriseSunsetApiResponse,
} from '../interfaces/sun.interface';

const SUN_API_URL = 'https://api.sunrise-sunset.org/json';

@Injectable()
export class SunService {
  constructor(private readonly httpService: HttpService) {}

  async getContext(destination: DestinationConfig): Promise<SunContext> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<SunriseSunsetApiResponse>(SUN_API_URL, {
          params: {
            lat: destination.latitude,
            lng: destination.longitude,
            formatted: 0,
          },
          timeout: 10000,
        }),
      );

      const { status, results } = response.data;

      if (
        status !== 'OK' ||
        !results?.sunrise ||
        !results?.sunset
      ) {
        throw new ServiceUnavailableException(
          'Respuesta incompleta del proveedor de amanecer/atardecer',
        );
      }

      return {
        sunrise: this.formatLocalTime(results.sunrise, destination.timezone),
        sunset: this.formatLocalTime(results.sunset, destination.timezone),
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        'No se pudo obtener información solar del destino',
      );
    }
  }

  private formatLocalTime(dateIso: string, timezone: string): string {
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(dateIso));
  }
}
