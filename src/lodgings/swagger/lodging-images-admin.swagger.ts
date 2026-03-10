import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiCreatedResponseWithType,
  ApiOkResponseWithType,
} from '../../swagger/decorators/api-response-with-type.decorator';
import { ConfirmLodgingImageResponseDto } from '../dto/confirm-lodging-image-response.dto';
import { DeleteLodgingImageResponseDto } from '../dto/delete-lodging-image-response.dto';
import { LodgingImageUploadUrlResponseDto } from '../dto/lodging-image-upload-url-response.dto';
import { SetDefaultLodgingImageResponseDto } from '../dto/set-default-lodging-image-response.dto';
import { ApiIdParam } from '../../swagger/decorators/api-id-param.decorator';

export function ApiLodgingImagesAdminController() {
  return applyDecorators(
    ApiTags('Admin - Lodgings Images'),
    ApiBearerAuth('access-token'),
  );
}

export function ApiCreateLodgingImageUploadUrlDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Generar URL firmada para imagen de alojamiento',
    }),
    ApiIdParam('lodgingId', 'ID del alojamiento'),
    ApiCreatedResponseWithType(LodgingImageUploadUrlResponseDto, {
      description: 'URL firmada generada correctamente',
    }),
  );
}

export function ApiConfirmLodgingImageUploadDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Confirmar upload de imagen de alojamiento',
    }),
    ApiIdParam('lodgingId', 'ID del alojamiento'),
    ApiCreatedResponseWithType(ConfirmLodgingImageResponseDto, {
      description: 'Upload confirmado correctamente',
    }),
  );
}

export function ApiSetDefaultLodgingImageDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Marcar imagen predeterminada',
    }),
    ApiIdParam('lodgingId', 'ID del alojamiento'),
    ApiIdParam('imageId', 'ID de la imagen'),
    ApiOkResponseWithType(SetDefaultLodgingImageResponseDto, {
      description: 'Imagen predeterminada actualizada correctamente',
    }),
  );
}

export function ApiDeleteLodgingImageDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Eliminar imagen de alojamiento',
    }),
    ApiIdParam('lodgingId', 'ID del alojamiento'),
    ApiIdParam('imageId', 'ID de la imagen'),
    ApiOkResponseWithType(DeleteLodgingImageResponseDto, {
      description: 'Imagen eliminada correctamente',
    }),
  );
}
