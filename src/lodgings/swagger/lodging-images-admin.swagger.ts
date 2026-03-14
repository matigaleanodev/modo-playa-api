import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiCreatedResponseWithType,
  ApiOkResponseWithType,
} from '../../swagger/decorators/api-response-with-type.decorator';
import { ConfirmLodgingImageResponseDto } from '../dto/confirm-lodging-image-response.dto';
import { DeleteLodgingImageResponseDto } from '../dto/delete-lodging-image-response.dto';
import { SetDefaultLodgingImageResponseDto } from '../dto/set-default-lodging-image-response.dto';
import { ApiIdParam } from '../../swagger/decorators/api-id-param.decorator';
import { ApiSingleFileBody } from '../../swagger/decorators/api-single-file-body.decorator';

export function ApiLodgingImagesAdminController() {
  return applyDecorators(
    ApiTags('Admin - Lodgings Images'),
    ApiBearerAuth('access-token'),
  );
}

export function ApiUploadLodgingImageFileDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Subir imagen de alojamiento por backend',
    }),
    ApiIdParam('lodgingId', 'ID del alojamiento'),
    ApiSingleFileBody('file'),
    ApiCreatedResponseWithType(ConfirmLodgingImageResponseDto, {
      description: 'Imagen subida y procesada correctamente',
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
