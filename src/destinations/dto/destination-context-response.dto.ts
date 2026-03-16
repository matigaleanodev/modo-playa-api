import { ApiProperty } from '@nestjs/swagger';
import { DestinationId } from '../providers/destination-id.enum';
import type { PointOfInterestCategory } from '../interfaces/point-of-interest.interface';

export class WeatherSnapshotDto {
  @ApiProperty({ example: 27 })
  temperature: number;

  @ApiProperty({ example: 14 })
  windSpeed: number;

  @ApiProperty({ example: 3 })
  weatherCode: number;
}

export class ForecastItemDto {
  @ApiProperty({ example: 'today' })
  day: 'today' | 'tomorrow';

  @ApiProperty({ example: 28 })
  max: number;

  @ApiProperty({ example: 19 })
  min: number;
}

export class SunContextDto {
  @ApiProperty({ example: '06:12' })
  sunrise: string;

  @ApiProperty({ example: '20:05' })
  sunset: string;
}

export class PointOfInterestDto {
  @ApiProperty({ example: 'hospital' })
  id: string;

  @ApiProperty({ example: 'Hospital Municipal' })
  title: string;

  @ApiProperty({
    example: 'healthcare',
    enum: ['healthcare', 'safety', 'downtown', 'pharmacy', 'beach'],
  })
  category: PointOfInterestCategory;

  @ApiProperty({
    example: 'Referencia sanitaria principal para guardia y atencion medica.',
  })
  summary: string;

  @ApiProperty({
    example:
      'https://www.google.com/maps/search/?api=1&query=Hospital%20Municipal%20Arturo%20Illia%20Villa%20Gesell',
  })
  googleMapsUrl: string;

  @ApiProperty({ example: 'Atencion de salud' })
  highlight: string;

  @ApiProperty({ example: 1 })
  displayOrder: number;
}

export class DestinationContextResponseDto {
  @ApiProperty({ enum: DestinationId, example: DestinationId.PAMPAS })
  destinationId: DestinationId;

  @ApiProperty({ example: 'Mar de las Pampas' })
  destination: string;

  @ApiProperty({ example: 'America/Argentina/Buenos_Aires' })
  timezone: string;

  @ApiProperty({ type: WeatherSnapshotDto })
  weather: WeatherSnapshotDto;

  @ApiProperty({ type: [ForecastItemDto] })
  forecast: ForecastItemDto[];

  @ApiProperty({ type: SunContextDto })
  sun: SunContextDto;

  @ApiProperty({ type: [PointOfInterestDto] })
  pointsOfInterest: PointOfInterestDto[];
}
