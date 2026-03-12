import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiCreatedResponseWithType,
  ApiOkResponseWithType,
} from '../../swagger/decorators/api-response-with-type.decorator';
import { LodgingImageUploadUrlResponseDto } from '@lodgings/dto/lodging-image-upload-url-response.dto';
import { ConfirmDraftLodgingImageResponseDto } from '@lodgings/dto/confirm-draft-lodging-image-response.dto';

export function ApiLodgingDraftImageUploadsAdminController() {
  return applyDecorators(
    ApiTags('Admin - Lodging Draft Image Uploads'),
    ApiBearerAuth('access-token'),
  );
}

export function ApiCreateDraftLodgingImageUploadUrlDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Generar URL firmada para imagen inicial de lodging',
      description:
        'Reserva un upload pendiente para el flujo de alta de lodging antes de que exista el lodging definitivo.',
    }),
    ApiCreatedResponseWithType(LodgingImageUploadUrlResponseDto, {
      description: 'URL firmada generada correctamente',
    }),
  );
}

export function ApiConfirmDraftLodgingImageUploadDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Confirmar upload pendiente de imagen inicial de lodging',
      description:
        'Valida que el archivo subido exista en storage y deja la imagen lista para asociarse al lodging al momento de crear el registro.',
    }),
    ApiOkResponseWithType(ConfirmDraftLodgingImageResponseDto, {
      description: 'Upload pendiente confirmado correctamente',
    }),
  );
}
