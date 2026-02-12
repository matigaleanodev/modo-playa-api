import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '@auth/guard/auth.guard';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { Contact } from './schemas/contact.schema';

import {
  CONTACT_RESPONSE_EXAMPLE,
  CONTACT_LIST_RESPONSE_EXAMPLE,
  DELETE_CONTACT_RESPONSE_EXAMPLE,
} from './contacts.swagger';

@ApiTags('Admin - Contacts')
@Controller('admin/contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @ApiOperation({
    summary: 'Crear contacto',
    description:
      'Crea un nuevo contacto asociado al owner autenticado. Si isDefault=true, desmarca el anterior default.',
  })
  @ApiResponse({
    status: 201,
    description: 'Contacto creado correctamente',
    schema: { example: CONTACT_RESPONSE_EXAMPLE },
  })
  @Post()
  create(
    @Body() dto: CreateContactDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<Contact> {
    return this.contactsService.create(dto, req.user.ownerId);
  }

  @ApiOperation({
    summary: 'Listar contactos',
    description:
      'Devuelve los contactos del owner autenticado. SUPERADMIN puede ver todos.',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Indica si se incluyen contactos inactivos',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de contactos',
    schema: { example: CONTACT_LIST_RESPONSE_EXAMPLE },
  })
  @Get()
  findAll(
    @Query('includeInactive') includeInactive: boolean | undefined,
    @Req() req: Request & { user: RequestUser },
  ): Promise<Contact[]> {
    return this.contactsService.findAll(
      includeInactive,
      req.user.ownerId,
      req.user.role,
    );
  }

  @ApiOperation({
    summary: 'Obtener contacto por ID',
    description:
      'Devuelve un contacto específico del owner. SUPERADMIN puede acceder a cualquiera.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del contacto',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Permite obtener contactos inactivos',
  })
  @ApiResponse({
    status: 200,
    description: 'Contacto encontrado',
    schema: { example: CONTACT_RESPONSE_EXAMPLE },
  })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('includeInactive') includeInactive: boolean | undefined,
    @Req() req: Request & { user: RequestUser },
  ): Promise<Contact> {
    return this.contactsService.findOne(
      id,
      includeInactive ?? false,
      req.user.ownerId,
      req.user.role,
    );
  }

  @ApiOperation({
    summary: 'Actualizar contacto',
    description:
      'Actualiza un contacto existente. Si se marca como default, desmarca el anterior.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del contacto',
  })
  @ApiResponse({
    status: 200,
    description: 'Contacto actualizado',
    schema: { example: CONTACT_RESPONSE_EXAMPLE },
  })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<Contact> {
    return this.contactsService.update(
      id,
      dto,
      req.user.ownerId,
      req.user.role,
    );
  }

  @ApiOperation({
    summary: 'Eliminar contacto',
    description:
      'Realiza un soft delete. No permite eliminar el contacto default.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del contacto',
  })
  @ApiResponse({
    status: 200,
    description: 'Contacto eliminado (soft delete)',
    schema: { example: DELETE_CONTACT_RESPONSE_EXAMPLE },
  })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: RequestUser },
  ): Promise<{ deleted: boolean }> {
    return this.contactsService.remove(id, req.user.ownerId, req.user.role);
  }
}
