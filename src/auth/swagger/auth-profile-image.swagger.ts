import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiOkResponseWithType } from '../../swagger/decorators/api-response-with-type.decorator';
import { ConfirmUserProfileImageResponseDto } from '@users/dto/confirm-user-profile-image-response.dto';
import { DeleteUserProfileImageResponseDto } from '@users/dto/delete-user-profile-image-response.dto';
import { ApiSingleFileBody } from '../../swagger/decorators/api-single-file-body.decorator';

export function ApiAuthProfileImageController() {
  return applyDecorators(
    ApiTags('Auth - Profile Image'),
    ApiBearerAuth('access-token'),
  );
}

export function ApiDeleteMyProfileImageDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Eliminar imagen de perfil propia',
      description:
        'Elimina la imagen de perfil del usuario autenticado. Disponible solo para usuarios OWNER.',
    }),
    ApiOkResponseWithType(DeleteUserProfileImageResponseDto, {
      description: 'Imagen de perfil eliminada correctamente',
    }),
  );
}

export function ApiUploadMyProfileImageFileDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Subir imagen de perfil propia por backend',
      description:
        'Recibe la imagen por multipart en la API, la procesa en backend y reemplaza la imagen previa si existe. Disponible solo para usuarios OWNER.',
    }),
    ApiSingleFileBody('file'),
    ApiOkResponseWithType(ConfirmUserProfileImageResponseDto, {
      description: 'Imagen de perfil subida correctamente',
    }),
  );
}
