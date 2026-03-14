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
  ApiContactsController,
  ApiCreateContactDoc,
  ApiDeleteContactDoc,
  ApiFindAllContactsDoc,
  ApiFindOneContactDoc,
  ApiUpdateContactDoc,
} from './contacts.swagger';
import { ContactMapper } from './contacts.mapper';

@ApiContactsController()
@Controller('admin/contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @ApiCreateContactDoc()
  @Post()
  async create(
    @Body() dto: CreateContactDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<ContactResponseDto> {
    const contact = await this.contactsService.create(
      dto,
      req.user.ownerId,
      req.user.role,
    );

    return ContactMapper.toResponse(contact);
  }

  @ApiFindAllContactsDoc()
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

  @ApiFindOneContactDoc()
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

  @ApiUpdateContactDoc()
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

  @ApiDeleteContactDoc()
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: RequestUser },
  ): Promise<{ deleted: boolean }> {
    return this.contactsService.remove(id, req.user.ownerId, req.user.role);
  }
}
