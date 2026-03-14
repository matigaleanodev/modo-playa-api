import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiCreatedResponseWithType,
  ApiOkResponseWithType,
} from '../../swagger/decorators/api-response-with-type.decorator';
import { UserProfileImageUploadUrlResponseDto } from '@users/dto/user-profile-image-upload-url-response.dto';
import { ConfirmUserProfileImageResponseDto } from '@users/dto/confirm-user-profile-image-response.dto';
import { DeleteUserProfileImageResponseDto } from '@users/dto/delete-user-profile-image-response.dto';

export function ApiAuthProfileImageController() {
  return applyDecorators(
    ApiTags('Auth - Profile Image'),
    ApiBearerAuth('access-token'),
  );
}

export function ApiCreateMyProfileImageUploadUrlDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Generar URL firmada para imagen de perfil propia',
      description:
        'Reserva un upload pendiente para la imagen de perfil del usuario autenticado. Disponible solo para usuarios OWNER.',
    }),
    ApiCreatedResponseWithType(UserProfileImageUploadUrlResponseDto, {
      description: 'URL firmada generada correctamente',
    }),
  );
}

export function ApiConfirmMyProfileImageUploadDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Confirmar imagen de perfil propia',
      description:
        'Confirma el upload firmado de la imagen de perfil del usuario autenticado y reemplaza la imagen previa si existe. Disponible solo para usuarios OWNER.',
    }),
    ApiOkResponseWithType(ConfirmUserProfileImageResponseDto, {
      description: 'Imagen de perfil confirmada correctamente',
    }),
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
