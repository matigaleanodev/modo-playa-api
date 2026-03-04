import { ApiProperty } from '@nestjs/swagger';

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

export class DestinationContextResponseDto {
  @ApiProperty({ example: 'Mar de las Pampas' })
  destination: string;

  @ApiProperty({ type: WeatherSnapshotDto })
  weather: WeatherSnapshotDto;

  @ApiProperty({ type: [ForecastItemDto] })
  forecast: ForecastItemDto[];

  @ApiProperty({ type: SunContextDto })
  sun: SunContextDto;
}
