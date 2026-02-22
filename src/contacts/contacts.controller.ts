import {
  Controller,
  DefaultValuePipe,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseBoolPipe,
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
  ApiBearerAuth,
} from '@nestjs/swagger';

import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '@auth/guard/auth.guard';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { ContactResponseDto } from './dto/contact-response.dto';
import { ContactsQueryDto } from './dto/contacts-query.dto';
import { PaginatedResponse } from '@common/interfaces/pagination-response.interface';
import { ContactDocument } from './schemas/contact.schema';

import {
  CONTACT_RESPONSE_EXAMPLE,
  CONTACT_LIST_RESPONSE_EXAMPLE,
  DELETE_CONTACT_RESPONSE_EXAMPLE,
} from './contacts.swagger';
import { ContactMapper } from './contacts.mapper';

@ApiTags('Admin - Contacts')
@ApiBearerAuth('access-token')
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
  async create(
    @Body() dto: CreateContactDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<ContactResponseDto> {
    const contact = await this.contactsService.create(dto, req.user.ownerId);

    return ContactMapper.toResponse(contact);
  }

  @ApiOperation({
    summary: 'Listar contactos',
    description:
      'Devuelve los contactos del owner autenticado. SUPERADMIN puede ver todos.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de registros por página',
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
  async findAll(
    @Query() query: ContactsQueryDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<PaginatedResponse<ContactResponseDto>> {
    const result: PaginatedResponse<ContactDocument> =
      await this.contactsService.findAll(
        query,
        req.user.ownerId,
        req.user.role,
      );
    const data: ContactResponseDto[] = result.data.map(
      (contact: ContactDocument): ContactResponseDto =>
        ContactMapper.toResponse(contact),
    );

    return {
      data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
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
  async findOne(
    @Param('id') id: string,
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe)
    includeInactive: boolean,
    @Req() req: Request & { user: RequestUser },
  ): Promise<ContactResponseDto> {
    const contact = await this.contactsService.findOne(
      id,
      includeInactive,
      req.user.ownerId,
      req.user.role,
    );

    return ContactMapper.toResponse(contact);
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
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<ContactResponseDto> {
    const contact = await this.contactsService.update(
      id,
      dto,
      req.user.ownerId,
      req.user.role,
    );

    return ContactMapper.toResponse(contact);
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
