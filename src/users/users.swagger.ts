import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiIdParam } from '../swagger/decorators/api-id-param.decorator';
import { ApiPaginatedOkResponse } from '../swagger/decorators/api-paginated-response.decorator';
import {
  ApiCreatedResponseWithType,
  ApiOkResponseWithType,
} from '../swagger/decorators/api-response-with-type.decorator';
import {
  createUserRequestExample,
  updateUserRequestExample,
  userResponseExample,
  usersPaginatedResponseExample,
} from '../swagger/examples/users.examples';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

export const CREATE_USER_EXAMPLE = createUserRequestExample;
export const UPDATE_USER_EXAMPLE = updateUserRequestExample;

export function ApiUsersController() {
  return applyDecorators(
    ApiTags('Admin - Users'),
    ApiBearerAuth('access-token'),
  );
}

export function ApiCreateUserDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Crear usuario para el owner actual',
      description:
        'Crea un usuario asociado al owner autenticado. SUPERADMIN puede crear en nombre de otro owner usando targetOwnerId. Limite de 3 usuarios por owner salvo SUPERADMIN.',
    }),
    ApiBody({
      type: CreateUserDto,
      examples: {
        default: {
          value: createUserRequestExample,
        },
      },
    }),
    ApiCreatedResponseWithType(UserResponseDto, {
      description: 'Usuario creado correctamente',
      example: userResponseExample,
    }),
  );
}

export function ApiFindAllUsersDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar usuarios del owner actual',
      description:
        'Devuelve los usuarios del owner autenticado. SUPERADMIN puede listar usuarios de todos los tenants sin filtro por ownerId.',
    }),
    ApiPaginatedOkResponse(UserResponseDto, {
      description: 'Listado de usuarios',
      example: usersPaginatedResponseExample,
    }),
  );
}

export function ApiFindUserByIdDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener usuario por ID',
      description:
        'Devuelve un usuario especifico del owner autenticado. SUPERADMIN puede acceder a cualquier usuario administrativo.',
    }),
    ApiIdParam('id', 'ID del usuario'),
    ApiOkResponseWithType(UserResponseDto, {
      description: 'Usuario encontrado',
      example: userResponseExample,
    }),
  );
}

export function ApiUpdateUserDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Actualizar usuario',
      description:
        'Actualiza un usuario del owner autenticado. SUPERADMIN puede modificar usuarios de cualquier tenant.',
    }),
    ApiIdParam('id', 'ID del usuario'),
    ApiBody({
      type: UpdateUserDto,
      examples: {
        default: {
          value: updateUserRequestExample,
        },
      },
    }),
    ApiOkResponseWithType(UserResponseDto, {
      description: 'Usuario actualizado',
      example: userResponseExample,
    }),
  );
}
