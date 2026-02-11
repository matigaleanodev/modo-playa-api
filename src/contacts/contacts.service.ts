import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contact, ContactDocument } from './schemas/contact.schema';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { DomainException } from '@common/exceptions/domain.exception';
import { ERROR_CODES } from '@common/constants/error-code';

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
  ) {}

  async create(dto: CreateContactDto) {
    if (dto.isDefault) {
      await this.contactModel.updateMany(
        { isDefault: true },
        { isDefault: false },
      );
    }

    const contact = new this.contactModel(dto);
    return contact.save();
  }

  async findAll(includeInactive = false) {
    const filter = includeInactive ? {} : { active: true };

    return this.contactModel.find(filter).sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Contact not found');
    }

    const contact = await this.contactModel.findOne({
      _id: id,
      active: true,
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async update(id: string, dto: UpdateContactDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Contact not found');
    }

    if (dto.isDefault) {
      await this.contactModel.updateMany(
        { isDefault: true },
        { isDefault: false },
      );
    }

    const updated = await this.contactModel.findOneAndUpdate(
      { _id: id, active: true },
      dto,
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Contact not found');
    }

    return updated;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Contact not found');
    }

    const contact = await this.contactModel.findOne({
      _id: id,
      active: true,
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (contact.isDefault) {
      throw new DomainException(
        'Cannot remove default contact. Set another contact as default first.',
        ERROR_CODES.CONTACT_DEFAULT_DELETE_FORBIDDEN,
        HttpStatus.CONFLICT,
      );
    }

    contact.active = false;
    return contact.save();
  }
}
