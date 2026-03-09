import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  forgotPasswordResponseExample,
  authLoginResponseExample,
  authTokenResponseExample,
  authUserResponseExample,
  requestActivationResponseExample,
  resetPasswordResponseExample,
} from '../../swagger/examples/auth.examples';
import {
  ApiCreatedResponseWithType,
  ApiOkResponseWithType,
} from '../../swagger/decorators/api-response-with-type.decorator';
import { AccessTokenResponseDto } from '../../swagger/dto/access-token-response.dto';
import { MessageResponseDto } from '../../swagger/dto/message-response.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { AuthUserResponseDto } from '../dto/auth-user-response.dto';

export function ApiAuthController() {
  return applyDecorators(ApiTags('Auth'));
}

export function ApiRequestActivationDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Solicitar activacion de cuenta',
      description:
        'Genera y envia un codigo de activacion al email del usuario si existe.',
    }),
    ApiOkResponseWithType(MessageResponseDto, {
      description: 'Codigo enviado si el usuario existe',
      example: requestActivationResponseExample,
    }),
  );
}

export function ApiActivateDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Activar usuario',
      description:
        'Genera un token temporal para que el usuario configure su contrasena.',
    }),
    ApiCreatedResponseWithType(AccessTokenResponseDto, {
      description: 'Token generado correctamente',
      example: authTokenResponseExample,
    }),
  );
}

export function ApiSetPasswordDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Configurar contrasena inicial',
    }),
    ApiBearerAuth('access-token'),
    ApiCreatedResponseWithType(AuthResponseDto, {
      description: 'Login automatico tras setear contrasena',
      example: authLoginResponseExample,
    }),
  );
}

export function ApiLoginDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Login de usuario',
    }),
    ApiCreatedResponseWithType(AuthResponseDto, {
      description: 'Login exitoso',
      example: authLoginResponseExample,
    }),
  );
}

export function ApiRefreshDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refrescar tokens',
    }),
    ApiBearerAuth('access-token'),
    ApiCreatedResponseWithType(AuthResponseDto, {
      description: 'Tokens renovados',
      example: authLoginResponseExample,
    }),
  );
}

export function ApiChangePasswordDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cambiar contrasena',
    }),
    ApiBearerAuth('access-token'),
    ApiCreatedResponseWithType(AuthResponseDto, {
      description: 'Contrasena actualizada y tokens renovados',
      example: authLoginResponseExample,
    }),
  );
}

export function ApiForgotPasswordDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Solicitar codigo de recuperacion',
      description:
        'Envia un codigo de recuperacion al email si el usuario existe.',
    }),
    ApiCreatedResponseWithType(MessageResponseDto, {
      description: 'Mensaje generico por seguridad',
      example: forgotPasswordResponseExample,
    }),
  );
}

export function ApiVerifyResetCodeDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verificar codigo de recuperacion',
    }),
    ApiCreatedResponseWithType(AccessTokenResponseDto, {
      description: 'Token temporal para resetear contrasena',
      example: authTokenResponseExample,
    }),
  );
}

export function ApiResetPasswordDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Resetear contrasena',
    }),
    ApiBearerAuth('access-token'),
    ApiCreatedResponseWithType(MessageResponseDto, {
      description: 'Contrasena actualizada correctamente',
      example: resetPasswordResponseExample,
    }),
  );
}

export function ApiMeDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener usuario autenticado',
    }),
    ApiBearerAuth('access-token'),
    ApiOkResponseWithType(AuthUserResponseDto, {
      description: 'Usuario autenticado',
      example: authUserResponseExample,
    }),
  );
}

export function ApiUpdateMeDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Actualizar perfil propio',
      description:
        'Actualiza datos basicos del usuario autenticado. La imagen de perfil se gestiona con endpoints de media.',
    }),
    ApiBearerAuth('access-token'),
    ApiOkResponseWithType(AuthUserResponseDto, {
      description: 'Perfil actualizado correctamente',
      example: authUserResponseExample,
    }),
  );
}
