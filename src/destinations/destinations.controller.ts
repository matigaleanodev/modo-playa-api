import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DestinationContextResponseDto } from './dto/destination-context-response.dto';
import { DestinationResponseDto } from './dto/destination-response.dto';
import { GetDestinationContextParamsDto } from './dto/get-destination-context-params.dto';
import { DestinationsService } from './destinations.service';
import { DestinationId } from './providers/destination-id.enum';

@ApiTags('Public - Destinations')
@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @ApiOperation({
    summary: 'Listar destinos disponibles',
    description:
      'Devuelve la lista de destinos soportados por Modo Playa para consultas de contexto.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de destinos disponibles',
    type: DestinationResponseDto,
    isArray: true,
  })
  @Get()
  getAll(): DestinationResponseDto[] {
    return this.destinationsService.getAll();
  }

  @ApiOperation({
    summary: 'Obtener contexto de un destino',
    description:
      'Devuelve clima actual, pronóstico corto y amanecer/atardecer para el destino seleccionado.',
  })
  @ApiParam({
    name: 'id',
    enum: DestinationId,
    description: 'Identificador del destino',
  })
  @ApiResponse({
    status: 200,
    description: 'Contexto del destino',
    type: DestinationContextResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'ID de destino inválido',
  })
  @ApiResponse({
    status: 503,
    description: 'Error al consultar proveedores externos',
  })
  @Get(':id/context')
  getContext(
    @Param() params: GetDestinationContextParamsDto,
  ): Promise<DestinationContextResponseDto> {
    return this.destinationsService.getContext(params.id);
  }
}
