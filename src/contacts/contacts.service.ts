import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { Contact, ContactDocument } from './schemas/contact.schema';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { DomainException } from '@common/exceptions/domain.exception';
import { ERROR_CODES } from '@common/constants/error-code';
import { UserRole } from '@common/interfaces/role.interface';

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
  ) {}

  async create(
    dto: CreateContactDto,
    ownerId: string,
  ): Promise<ContactDocument> {
    if (dto.isDefault) {
      await this.contactModel.updateMany(
        { ownerId: new Types.ObjectId(ownerId), isDefault: true },
        { isDefault: false },
      );
    }

    const contact = new this.contactModel({
      ...dto,
      ownerId: new Types.ObjectId(ownerId),
    });

    return contact.save();
  }

  async findAll(
    includeInactive: boolean = false,
    ownerId: string,
    role: UserRole,
  ): Promise<ContactDocument[]> {
    const filters: QueryFilter<ContactDocument> = {};

    if (!includeInactive) {
      filters.active = true;
    }

    if (role !== 'SUPERADMIN') {
      filters.ownerId = new Types.ObjectId(ownerId);
    }

    return this.contactModel.find(filters).sort({ createdAt: -1 }).exec();
  }

  async findOne(
    id: string,
    includeInactive: boolean,
    ownerId: string,
    role: UserRole,
  ): Promise<ContactDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new DomainException(
        'Contact not found',
        ERROR_CODES.CONTACT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const filters: QueryFilter<ContactDocument> = {
      _id: new Types.ObjectId(id),
    };

    if (!includeInactive) {
      filters.active = true;
    }

    if (role !== 'SUPERADMIN') {
      filters.ownerId = new Types.ObjectId(ownerId);
    }

    const contact = await this.contactModel.findOne(filters);

    if (!contact) {
      throw new DomainException(
        'Contact not found',
        ERROR_CODES.CONTACT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return contact;
  }

  async update(
    id: string,
    dto: UpdateContactDto,
    ownerId: string,
    role: UserRole,
  ): Promise<ContactDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new DomainException(
        'Contact not found',
        ERROR_CODES.CONTACT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const filters: QueryFilter<ContactDocument> = {
      _id: new Types.ObjectId(id),
    };

    if (role !== 'SUPERADMIN') {
      filters.ownerId = new Types.ObjectId(ownerId);
    }

    const existing = await this.contactModel.findOne(filters);

    if (!existing) {
      throw new DomainException(
        'Contact not found',
        ERROR_CODES.CONTACT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.isDefault === true && existing.active === false) {
      throw new DomainException(
        'Inactive contact cannot be default',
        ERROR_CODES.CONTACT_NOT_ALLOWED,
        HttpStatus.CONFLICT,
      );
    }

    if (dto.isDefault === true) {
      await this.contactModel.updateMany(
        {
          ownerId: existing.ownerId,
          isDefault: true,
        },
        { isDefault: false },
      );
    }

    existing.set(dto);
    return existing.save();
  }

  async remove(
    id: string,
    ownerId: string,
    role: UserRole,
  ): Promise<{ deleted: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new DomainException(
        'Contact not found',
        ERROR_CODES.CONTACT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const filters: QueryFilter<ContactDocument> = {
      _id: new Types.ObjectId(id),
    };

    if (role !== 'SUPERADMIN') {
      filters.ownerId = new Types.ObjectId(ownerId);
    }

    const contact = await this.contactModel.findOne(filters);

    if (!contact) {
      throw new DomainException(
        'Contact not found',
        ERROR_CODES.CONTACT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (contact.isDefault) {
      throw new DomainException(
        'Cannot remove default contact. Set another contact as default first.',
        ERROR_CODES.CONTACT_DEFAULT_DELETE_FORBIDDEN,
        HttpStatus.CONFLICT,
      );
    }

    contact.active = false;
    await contact.save();

    return { deleted: true };
  }
}
