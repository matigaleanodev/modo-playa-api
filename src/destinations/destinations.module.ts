import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DestinationsController } from './destinations.controller';
import { DestinationsService } from './destinations.service';
import { SunService } from './services/sun.service';
import { WeatherService } from './services/weather.service';

@Module({
  imports: [HttpModule],
  controllers: [DestinationsController],
  providers: [DestinationsService, WeatherService, SunService],
})
export class DestinationsModule {}
