import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiIdParam } from '../swagger/decorators/api-id-param.decorator';
import { ApiPaginatedOkResponse } from '../swagger/decorators/api-paginated-response.decorator';
import {
  ApiCreatedResponseWithType,
  ApiOkResponseWithType,
} from '../swagger/decorators/api-response-with-type.decorator';
import {
  contactResponseExample,
  contactsPaginatedResponseExample,
} from '../swagger/examples/contacts.examples';
import { DeleteResponseDto } from '../swagger/dto/delete-response.dto';
import { ContactResponseDto } from './dto/contact-response.dto';

export function ApiContactsController() {
  return applyDecorators(
    ApiTags('Admin - Contacts'),
    ApiBearerAuth('access-token'),
  );
}

export function ApiCreateContactDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Crear contacto',
      description:
        'Crea un nuevo contacto asociado al owner autenticado. SUPERADMIN puede crear en nombre de otro owner usando targetOwnerId. Si isDefault=true, desmarca el anterior default.',
    }),
    ApiCreatedResponseWithType(ContactResponseDto, {
      description: 'Contacto creado correctamente',
      example: contactResponseExample,
    }),
  );
}

export function ApiFindAllContactsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar contactos',
      description:
        'Devuelve los contactos del owner autenticado. SUPERADMIN puede ver todos.',
    }),
    ApiPaginatedOkResponse(ContactResponseDto, {
      description: 'Listado de contactos',
      example: contactsPaginatedResponseExample,
    }),
  );
}

export function ApiFindOneContactDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener contacto por ID',
      description:
        'Devuelve un contacto especifico del owner. SUPERADMIN puede acceder a cualquiera.',
    }),
    ApiIdParam('id', 'ID del contacto'),
    ApiOkResponseWithType(ContactResponseDto, {
      description: 'Contacto encontrado',
      example: contactResponseExample,
    }),
  );
}

export function ApiUpdateContactDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Actualizar contacto',
      description:
        'Actualiza un contacto existente. Si se marca como default, desmarca el anterior.',
    }),
    ApiIdParam('id', 'ID del contacto'),
    ApiOkResponseWithType(ContactResponseDto, {
      description: 'Contacto actualizado',
      example: contactResponseExample,
    }),
  );
}

export function ApiDeleteContactDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Eliminar contacto',
      description:
        'Realiza un soft delete. No permite eliminar el contacto default.',
    }),
    ApiIdParam('id', 'ID del contacto'),
    ApiOkResponseWithType(DeleteResponseDto, {
      description: 'Contacto eliminado (soft delete)',
      example: { deleted: true },
    }),
  );
}
