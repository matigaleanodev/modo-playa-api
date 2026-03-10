import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DestinationContextResponseDto } from './dto/destination-context-response.dto';
import { DestinationResponseDto } from './dto/destination-response.dto';
import { DestinationId } from './providers/destination-id.enum';
import { ApiOkResponseWithType } from '../swagger/decorators/api-response-with-type.decorator';

export function ApiDestinationsController() {
  return applyDecorators(ApiTags('Public - Destinations'));
}

export function ApiGetDestinationsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar destinos disponibles',
      description:
        'Devuelve la lista de destinos soportados por Modo Playa para consultas de contexto.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de destinos disponibles',
      type: DestinationResponseDto,
      isArray: true,
    }),
  );
}

export function ApiGetDestinationContextDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener contexto de un destino',
      description:
        'Devuelve clima actual, pronostico corto y amanecer/atardecer para el destino seleccionado.',
    }),
    ApiParam({
      name: 'id',
      enum: DestinationId,
      description: 'Identificador del destino',
    }),
    ApiOkResponseWithType(DestinationContextResponseDto, {
      description: 'Contexto del destino',
    }),
    ApiResponse({
      status: 400,
      description: 'ID de destino invalido',
    }),
    ApiResponse({
      status: 503,
      description: 'Error al consultar proveedores externos',
    }),
  );
}
