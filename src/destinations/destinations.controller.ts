import { Controller, Get, Param } from '@nestjs/common';
import { DestinationContextResponseDto } from './dto/destination-context-response.dto';
import { DestinationResponseDto } from './dto/destination-response.dto';
import { GetDestinationContextParamsDto } from './dto/get-destination-context-params.dto';
import { DestinationsService } from './destinations.service';
import {
  ApiDestinationsController,
  ApiGetDestinationContextDoc,
  ApiGetDestinationsDoc,
} from './destinations.swagger';

@ApiDestinationsController()
@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @ApiGetDestinationsDoc()
  @Get()
  getAll(): DestinationResponseDto[] {
    return this.destinationsService.getAll();
  }

  @ApiGetDestinationContextDoc()
  @Get(':id/context')
  getContext(
    @Param() params: GetDestinationContextParamsDto,
  ): Promise<DestinationContextResponseDto> {
    return this.destinationsService.getContext(params.id);
  }
}
