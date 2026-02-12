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
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '@auth/guard/auth.guard';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { Contact } from './schemas/contact.schema';

@Controller('admin/contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(
    @Body() dto: CreateContactDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<Contact> {
    return this.contactsService.create(dto, req.user.ownerId);
  }

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

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: RequestUser },
  ): Promise<{ deleted: boolean }> {
    return this.contactsService.remove(id, req.user.ownerId, req.user.role);
  }
}
