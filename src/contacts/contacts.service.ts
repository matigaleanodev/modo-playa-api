import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { Contact, ContactDocument } from './schemas/contact.schema';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { DomainException } from '@common/exceptions/domain.exception';
import { ERROR_CODES } from '@common/constants/error-code';
import { UserRole } from '@common/interfaces/role.interface';
import { ContactsQueryDto } from './dto/contacts-query.dto';
import { PaginatedResponse } from '@common/interfaces/pagination-response.interface';
import { toObjectIdOrThrow } from '@common/utils/object-id.util';

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
  ) {}

  async create(
    dto: CreateContactDto,
    ownerId: string,
    role: UserRole,
  ): Promise<ContactDocument> {
    const ownerObjectId = this.resolveTargetOwnerId(
      ownerId,
      role,
      dto.targetOwnerId,
    );
    if (dto.isDefault) {
      await this.contactModel.updateMany(
        { ownerId: ownerObjectId, isDefault: true },
        { isDefault: false },
      );
    }

    const contact = new this.contactModel({
      ...dto,
      ownerId: ownerObjectId,
    });
    try {
      return await contact.save();
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new DomainException(
          'Another default contact already exists for this owner',
          ERROR_CODES.CONTACT_NOT_ALLOWED,
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  async findAll(
    query: ContactsQueryDto,
    ownerId: string,
    role: UserRole,
  ): Promise<PaginatedResponse<ContactDocument>> {
    const { includeInactive = false, page = 1, limit = 10 } = query;
    const filters: QueryFilter<ContactDocument> = {};

    if (!includeInactive) {
      filters.active = true;
    }

    if (role !== 'SUPERADMIN') {
      filters.ownerId = toObjectIdOrThrow(ownerId, {
        message: 'Invalid owner id',
        errorCode: ERROR_CODES.INVALID_OWNER_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      });
    }

    const [data, total] = await Promise.all([
      this.contactModel
        .find(filters)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.contactModel.countDocuments(filters).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findOne(
    id: string,
    includeInactive: boolean,
    ownerId: string,
    role: UserRole,
  ): Promise<ContactDocument> {
    const filters: QueryFilter<ContactDocument> = {
      _id: toObjectIdOrThrow(id, {
        message: 'Contact not found',
        errorCode: ERROR_CODES.CONTACT_NOT_FOUND,
        httpStatus: HttpStatus.NOT_FOUND,
      }),
    };

    if (!includeInactive) {
      filters.active = true;
    }

    if (role !== 'SUPERADMIN') {
      filters.ownerId = toObjectIdOrThrow(ownerId, {
        message: 'Invalid owner id',
        errorCode: ERROR_CODES.INVALID_OWNER_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      });
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
    const filters: QueryFilter<ContactDocument> = {
      _id: toObjectIdOrThrow(id, {
        message: 'Contact not found',
        errorCode: ERROR_CODES.CONTACT_NOT_FOUND,
        httpStatus: HttpStatus.NOT_FOUND,
      }),
    };

    if (role !== 'SUPERADMIN') {
      filters.ownerId = toObjectIdOrThrow(ownerId, {
        message: 'Invalid owner id',
        errorCode: ERROR_CODES.INVALID_OWNER_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      });
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

    try {
      return await existing.save();
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new DomainException(
          'Another default contact already exists for this owner',
          ERROR_CODES.CONTACT_NOT_ALLOWED,
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  async remove(
    id: string,
    ownerId: string,
    role: UserRole,
  ): Promise<{ deleted: boolean }> {
    const filters: QueryFilter<ContactDocument> = {
      _id: toObjectIdOrThrow(id, {
        message: 'Contact not found',
        errorCode: ERROR_CODES.CONTACT_NOT_FOUND,
        httpStatus: HttpStatus.NOT_FOUND,
      }),
    };

    if (role !== 'SUPERADMIN') {
      filters.ownerId = toObjectIdOrThrow(ownerId, {
        message: 'Invalid owner id',
        errorCode: ERROR_CODES.INVALID_OWNER_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      });
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

  private resolveTargetOwnerId(
    requesterOwnerId: string,
    role: UserRole,
    targetOwnerId?: string,
  ): Types.ObjectId {
    const effectiveOwnerId =
      role === 'SUPERADMIN' && targetOwnerId ? targetOwnerId : requesterOwnerId;

    return toObjectIdOrThrow(effectiveOwnerId, {
      message: 'Invalid owner id',
      errorCode: ERROR_CODES.INVALID_OWNER_ID,
      httpStatus: HttpStatus.BAD_REQUEST,
    });
  }
}
