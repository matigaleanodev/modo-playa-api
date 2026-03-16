import { Injectable, NotFoundException } from '@nestjs/common';
import { DestinationContextResponseDto } from './dto/destination-context-response.dto';
import { DestinationResponseDto } from './dto/destination-response.dto';
import { DestinationId } from './providers/destination-id.enum';
import {
  DESTINATIONS,
  DESTINATIONS_MAP,
} from './providers/destinations.config';
import { POINTS_OF_INTEREST_MAP } from './providers/points-of-interest.config';
import { SunService } from './services/sun.service';
import { WeatherService } from './services/weather.service';

@Injectable()
export class DestinationsService {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly sunService: SunService,
  ) {}

  getAll(): DestinationResponseDto[] {
    return DESTINATIONS.map((destination) => ({
      id: destination.id,
      name: destination.name,
    }));
  }

  async getContext(id: DestinationId): Promise<DestinationContextResponseDto> {
    const destination = DESTINATIONS_MAP[id];

    if (!destination) {
      throw new NotFoundException('Destino no encontrado');
    }

    const [weatherContext, sunContext] = await Promise.all([
      this.weatherService.getContext(destination),
      this.sunService.getContext(destination),
    ]);

    return {
      destinationId: destination.id,
      destination: destination.name,
      timezone: destination.timezone,
      weather: weatherContext.weather,
      forecast: weatherContext.forecast,
      sun: sunContext,
      pointsOfInterest: POINTS_OF_INTEREST_MAP[destination.id] ?? [],
    };
  }
}
