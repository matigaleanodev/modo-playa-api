import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCreatedResponseWithType } from '../../swagger/decorators/api-response-with-type.decorator';
import { ConfirmDraftLodgingImageResponseDto } from '@lodgings/dto/confirm-draft-lodging-image-response.dto';
import { ApiFormDataBody } from '../../swagger/decorators/api-form-data-body.decorator';

export function ApiLodgingDraftImageUploadsAdminController() {
  return applyDecorators(
    ApiTags('Admin - Lodging Draft Image Uploads'),
    ApiBearerAuth('access-token'),
  );
}

export function ApiUploadDraftLodgingImageFileDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Subir imagen inicial de lodging por backend',
      description:
        'Recibe la imagen por multipart en la API, la sube al storage desde backend y la deja lista para asociarse al lodging al momento de crear el registro.',
    }),
    ApiFormDataBody({
      requiredFields: ['uploadSessionId'],
      properties: {
        uploadSessionId: {
          type: 'string',
          format: 'uuid',
          description: 'Sesion de upload del alta de lodging.',
        },
      },
    }),
    ApiCreatedResponseWithType(ConfirmDraftLodgingImageResponseDto, {
      description: 'Imagen draft subida y confirmada correctamente',
    }),
  );
}
