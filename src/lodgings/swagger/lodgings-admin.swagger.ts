import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AvailabilityRangeDto } from '../dto/availability-range.dto';
import { LodgingResponseDto } from '../dto/lodging-response.dto';
import { ApiIdParam } from '../../swagger/decorators/api-id-param.decorator';
import { ApiJsonPayloadFilesBody } from '../../swagger/decorators/api-json-payload-files-body.decorator';
import { ApiPaginatedOkResponse } from '../../swagger/decorators/api-paginated-response.decorator';
import {
  ApiCreatedResponseWithType,
  ApiOkResponseWithType,
} from '../../swagger/decorators/api-response-with-type.decorator';
import { DeleteResponseDto } from '../../swagger/dto/delete-response.dto';
import {
  adminLodgingsPaginatedResponseExample,
  lodgingResponseExample,
} from '../../swagger/examples/lodgings.examples';

export function ApiAdminLodgingsController() {
  return applyDecorators(
    ApiTags('Admin - Lodgings'),
    ApiBearerAuth('access-token'),
  );
}

export function ApiCreateLodgingDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Crear alojamiento',
      description: 'Crea un nuevo alojamiento asociado al owner autenticado.',
    }),
    ApiCreatedResponseWithType(LodgingResponseDto, {
      description: 'Alojamiento creado correctamente',
      example: lodgingResponseExample,
    }),
  );
}

export function ApiCreateLodgingWithImagesDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Crear alojamiento con imagenes (flujo unificado)',
      description:
        'Crea un alojamiento y procesa imagenes en una sola transaccion backend usando multipart/form-data.',
    }),
    ApiJsonPayloadFilesBody(
      'JSON serializado con el CreateLodgingWithImagesDto',
    ),
    ApiCreatedResponseWithType(LodgingResponseDto, {
      description: 'Alojamiento creado correctamente con imagenes procesadas',
      example: lodgingResponseExample,
    }),
  );
}

export function ApiFindAllAdminLodgingsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar alojamientos (admin)',
      description:
        'Devuelve alojamientos del owner autenticado. SUPERADMIN puede ver todos.',
    }),
    ApiPaginatedOkResponse(LodgingResponseDto, {
      description: 'Listado paginado de alojamientos',
      example: adminLodgingsPaginatedResponseExample,
    }),
  );
}

export function ApiFindAdminLodgingByIdDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener alojamiento por ID (admin)',
      description:
        'Devuelve un alojamiento especifico del owner. SUPERADMIN puede acceder a cualquiera.',
    }),
    ApiIdParam('id', 'ID del alojamiento'),
    ApiOkResponseWithType(LodgingResponseDto, {
      description: 'Alojamiento encontrado',
      example: lodgingResponseExample,
    }),
  );
}

export function ApiUpdateLodgingDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Actualizar alojamiento',
      description:
        'Actualiza un alojamiento existente. Respeta reglas de owner y SUPERADMIN.',
    }),
    ApiIdParam('id', 'ID del alojamiento'),
    ApiOkResponseWithType(LodgingResponseDto, {
      description: 'Alojamiento actualizado',
      example: lodgingResponseExample,
    }),
  );
}

export function ApiUpdateLodgingWithImagesDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Actualizar alojamiento con imagenes (flujo unificado)',
      description:
        'Actualiza el alojamiento y procesa nuevas imagenes en una sola llamada multipart/form-data.',
    }),
    ApiJsonPayloadFilesBody('JSON serializado con UpdateLodgingWithImagesDto'),
    ApiOkResponseWithType(LodgingResponseDto, {
      description:
        'Alojamiento actualizado correctamente con imagenes procesadas',
      example: lodgingResponseExample,
    }),
  );
}

export function ApiGetOccupiedRangesDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener rangos ocupados del alojamiento',
      description:
        'Devuelve los rangos ocupados (availability) del alojamiento.',
    }),
    ApiIdParam('id', 'ID del alojamiento'),
    ApiOkResponse({
      description: 'Rangos ocupados encontrados',
      type: AvailabilityRangeDto,
      isArray: true,
    }),
  );
}

export function ApiAddOccupiedRangeDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Agregar rango ocupado',
      description:
        'Agrega un rango ocupado normalizado a inicio del dia y valida conflictos.',
    }),
    ApiIdParam('id', 'ID del alojamiento'),
    ApiCreatedResponse({
      description: 'Rango ocupado agregado',
      type: AvailabilityRangeDto,
      isArray: true,
    }),
  );
}

export function ApiRemoveOccupiedRangeDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Eliminar rango ocupado',
      description: 'Elimina un rango ocupado exacto del alojamiento.',
    }),
    ApiIdParam('id', 'ID del alojamiento'),
    ApiOkResponse({
      description: 'Rango ocupado eliminado',
      type: AvailabilityRangeDto,
      isArray: true,
    }),
  );
}

export function ApiDeleteLodgingDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Eliminar alojamiento',
      description:
        'Realiza soft delete de un alojamiento. SUPERADMIN puede eliminar cualquier registro.',
    }),
    ApiIdParam('id', 'ID del alojamiento'),
    ApiOkResponseWithType(DeleteResponseDto, {
      description: 'Alojamiento eliminado',
      example: { deleted: true },
    }),
  );
}
