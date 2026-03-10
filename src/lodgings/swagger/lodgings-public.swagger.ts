import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LodgingResponseDto } from '../dto/lodging-response.dto';
import { ApiIdParam } from '../../swagger/decorators/api-id-param.decorator';
import { ApiPaginatedOkResponse } from '../../swagger/decorators/api-paginated-response.decorator';
import { ApiOkResponseWithType } from '../../swagger/decorators/api-response-with-type.decorator';
import {
  publicLodgingResponseExample,
  publicLodgingsPaginatedResponseExample,
} from '../../swagger/examples/lodgings.examples';

export function ApiPublicLodgingsController() {
  return applyDecorators(ApiTags('Public - Lodgings'));
}

export function ApiFindAllPublicLodgingsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar alojamientos publicos',
      description:
        'Devuelve alojamientos activos. Permite busqueda por texto y filtrado por tags.',
    }),
    ApiPaginatedOkResponse(LodgingResponseDto, {
      description: 'Listado paginado de alojamientos publicos',
      example: publicLodgingsPaginatedResponseExample,
    }),
  );
}

export function ApiFindPublicLodgingByIdDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener alojamiento publico por ID',
      description:
        'Devuelve un alojamiento activo especifico. Si no esta activo, devuelve 404.',
    }),
    ApiIdParam('id', 'ID del alojamiento'),
    ApiOkResponseWithType(LodgingResponseDto, {
      description: 'Alojamiento encontrado',
      example: publicLodgingResponseExample,
    }),
    ApiResponse({
      status: 404,
      description: 'Alojamiento no encontrado',
    }),
  );
}
