import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  activateRequestExample,
  changePasswordRequestExample,
  forgotPasswordResponseExample,
  identifierRequestExample,
  authLoginResponseExample,
  loginRequestExample,
  resetPasswordRequestExample,
  setInitialPasswordRequestExample,
  authTokenResponseExample,
  authUserResponseExample,
  requestActivationResponseExample,
  resetPasswordResponseExample,
  updateMeRequestExample,
  verifyResetCodeRequestExample,
} from '../../swagger/examples/auth.examples';
import {
  ApiCreatedResponseWithType,
  ApiOkResponseWithType,
} from '../../swagger/decorators/api-response-with-type.decorator';
import { AccessTokenResponseDto } from '../../swagger/dto/access-token-response.dto';
import { MessageResponseDto } from '../../swagger/dto/message-response.dto';
import { ActivateDto } from '../dto/activate.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { AuthUserResponseDto } from '../dto/auth-user-response.dto';
import { AuthIdentifierDto } from '../dto/auth-identifier.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { SetInitialPasswordDto } from '../dto/set-initial-password.dto';
import { UpdateMyProfileDto } from '../dto/update-my-profile.dto';
import { VerifyResetCodeDto } from '../dto/verify-reset-code.dto';

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
    ApiBody({
      type: AuthIdentifierDto,
      examples: {
        default: {
          value: identifierRequestExample,
        },
      },
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
    ApiBody({
      type: ActivateDto,
      examples: {
        default: {
          value: activateRequestExample,
        },
      },
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
      description:
        'Define la contrasena inicial usando un token temporal de PASSWORD_SETUP y devuelve sesion autenticada.',
    }),
    ApiBearerAuth('access-token'),
    ApiBody({
      type: SetInitialPasswordDto,
      examples: {
        default: {
          value: setInitialPasswordRequestExample,
        },
      },
    }),
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
    ApiBody({
      type: LoginDto,
      examples: {
        default: {
          value: loginRequestExample,
        },
      },
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
      description:
        'Actualiza la contrasena del usuario autenticado y devuelve nuevos tokens.',
    }),
    ApiBearerAuth('access-token'),
    ApiBody({
      type: ChangePasswordDto,
      examples: {
        default: {
          value: changePasswordRequestExample,
        },
      },
    }),
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
    ApiBody({
      type: AuthIdentifierDto,
      examples: {
        default: {
          value: identifierRequestExample,
        },
      },
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
    ApiBody({
      type: VerifyResetCodeDto,
      examples: {
        default: {
          value: verifyResetCodeRequestExample,
        },
      },
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
      description:
        'Permite definir una nueva contrasena usando un token temporal de PASSWORD_SETUP.',
    }),
    ApiBearerAuth('access-token'),
    ApiBody({
      type: ResetPasswordDto,
      examples: {
        default: {
          value: resetPasswordRequestExample,
        },
      },
    }),
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
    ApiBody({
      type: UpdateMyProfileDto,
      examples: {
        default: {
          value: updateMeRequestExample,
        },
      },
    }),
    ApiOkResponseWithType(AuthUserResponseDto, {
      description: 'Perfil actualizado correctamente',
      example: authUserResponseExample,
    }),
  );
}
