import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiIdParam } from '../swagger/decorators/api-id-param.decorator';
import { ApiSingleFileBody } from '../swagger/decorators/api-single-file-body.decorator';
import {
  ApiCreatedResponseWithType,
  ApiOkResponseWithType,
} from '../swagger/decorators/api-response-with-type.decorator';
import { ConfirmUserProfileImageResponseDto } from './dto/confirm-user-profile-image-response.dto';
import { DeleteUserProfileImageResponseDto } from './dto/delete-user-profile-image-response.dto';
import { UserProfileImageUploadUrlResponseDto } from './dto/user-profile-image-upload-url-response.dto';

export function ApiUsersProfileImagesController() {
  return applyDecorators(
    ApiTags('Admin - Users Profile Images'),
    ApiBearerAuth('access-token'),
  );
}

export function ApiCreateUserProfileUploadUrlDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Generar URL firmada para imagen de perfil' }),
    ApiIdParam('id', 'ID del usuario'),
    ApiCreatedResponseWithType(UserProfileImageUploadUrlResponseDto, {
      description: 'URL firmada generada correctamente',
    }),
  );
}

export function ApiUploadUserProfileImageDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Subir imagen de perfil directo al backend',
    }),
    ApiIdParam('id', 'ID del usuario'),
    ApiSingleFileBody('file'),
    ApiCreatedResponseWithType(ConfirmUserProfileImageResponseDto, {
      description: 'Imagen subida y procesada correctamente',
    }),
  );
}

export function ApiConfirmUserProfileUploadDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Confirmar upload de imagen de perfil' }),
    ApiIdParam('id', 'ID del usuario'),
    ApiCreatedResponseWithType(ConfirmUserProfileImageResponseDto, {
      description: 'Upload confirmado correctamente',
    }),
  );
}

export function ApiDeleteUserProfileImageDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Eliminar imagen de perfil' }),
    ApiIdParam('id', 'ID del usuario'),
    ApiOkResponseWithType(DeleteUserProfileImageResponseDto, {
      description: 'Imagen de perfil eliminada correctamente',
    }),
  );
}
