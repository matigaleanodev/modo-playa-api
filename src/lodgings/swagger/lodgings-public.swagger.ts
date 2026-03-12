import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiIdParam } from '../../swagger/decorators/api-id-param.decorator';
import { ApiPaginatedOkResponse } from '../../swagger/decorators/api-paginated-response.decorator';
import { ApiOkResponseWithType } from '../../swagger/decorators/api-response-with-type.decorator';
import {
  publicLodgingResponseExample,
  publicLodgingsPaginatedResponseExample,
} from '../../swagger/examples/lodgings.examples';
import { PublicLodgingResponseDto } from '../dto/public-lodging-response.dto';

export function ApiPublicLodgingsController() {
  return applyDecorators(ApiTags('Public - Lodgings'));
}

export function ApiFindAllPublicLodgingsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar alojamientos publicos',
      description:
        'Devuelve alojamientos activos con contrato publico estable. Permite busqueda por texto y filtros de catalogo sin exponer referencias internas administrativas.',
    }),
    ApiPaginatedOkResponse(PublicLodgingResponseDto, {
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
        'Devuelve un alojamiento activo especifico usando el mismo contrato publico estable del listado. Si no esta activo, devuelve 404.',
    }),
    ApiIdParam('id', 'ID del alojamiento'),
    ApiOkResponseWithType(PublicLodgingResponseDto, {
      description: 'Alojamiento encontrado',
      example: publicLodgingResponseExample,
    }),
    ApiResponse({
      status: 404,
      description: 'Alojamiento no encontrado',
    }),
  );
}
