import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateLodgingDto } from './dto/create-lodging.dto';
import { UpdateLodgingDto } from './dto/update-lodging.dto';
import { Contact, ContactDocument } from '@contacts/schemas/contact.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, QueryFilter } from 'mongoose';
import { Lodging, LodgingDocument } from './schemas/lodging.schema';
import { AvailabilityRangeDto } from './dto/availability-range.dto';
import { DomainException } from '@common/exceptions/domain.exception';
import { ERROR_CODES } from '@common/constants/error-code';
import {
  AdminLodgingsQueryDto,
  PublicLodgingsQueryDto,
} from './dto/pagination-query.dto';
import { PaginatedResponse } from '@common/interfaces/pagination-response.interface';
import { UserRole } from '@common/interfaces/role.interface';

@Injectable()
export class LodgingsService {
  constructor(
    @InjectModel(Lodging.name)
    private readonly lodgingModel: Model<LodgingDocument>,

    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
  ) {}

  async create(dto: CreateLodgingDto, ownerId: string): Promise<Lodging> {
    this.validateRanges(dto.occupiedRanges);

    let contactId: Types.ObjectId | undefined;

    if (dto.contactId) {
      if (!Types.ObjectId.isValid(dto.contactId)) {
        throw new DomainException(
          'Invalid contact id',
          ERROR_CODES.INVALID_OBJECT_ID,
          HttpStatus.BAD_REQUEST,
        );
      }

      const contact = await this.contactModel.findOne({
        _id: dto.contactId,
        ownerId,
        active: true,
      });

      if (!contact) {
        throw new DomainException(
          'Contact not found or not allowed',
          ERROR_CODES.CONTACT_NOT_ALLOWED,
          HttpStatus.NOT_FOUND,
        );
      }

      contactId = contact._id;
    } else {
      const defaultContact = await this.contactModel.findOne({
        ownerId,
        isDefault: true,
        active: true,
      });

      if (defaultContact) {
        contactId = defaultContact._id;
      }
    }

    const lodging = new this.lodgingModel({
      ...dto,
      ownerId,
      contactId,
    });

    return lodging.save();
  }

  async findPublicPaginated(
    query: PublicLodgingsQueryDto,
  ): Promise<PaginatedResponse<Lodging>> {
    const {
      page = 1,
      limit = 10,
      search,
      city,
      minGuests,
      minPrice,
      maxPrice,
      amenities,
    } = query;

    const filters: QueryFilter<LodgingDocument> = {
      active: true,
    };

    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    if (city) {
      filters.city = city;
    }

    if (minGuests !== undefined) {
      filters.maxGuests = { $gte: minGuests };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (minPrice !== undefined) priceFilter.$gte = minPrice;
      if (maxPrice !== undefined) priceFilter.$lte = maxPrice;
      filters.price = priceFilter;
    }

    if (amenities && amenities.length > 0) {
      filters.amenities = { $all: amenities };
    }

    const [data, total] = await Promise.all([
      this.lodgingModel
        .find(filters)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.lodgingModel.countDocuments(filters),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findPublicById(id: string): Promise<Lodging> {
    const lodging = await this.lodgingModel.findOne({
      _id: id,
      active: true,
    });

    if (!lodging) {
      throw new DomainException(
        'Lodging not found',
        ERROR_CODES.LODGING_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return lodging;
  }

  async findAdminPaginated(
    query: AdminLodgingsQueryDto,
    ownerId: string,
    role: UserRole,
  ): Promise<PaginatedResponse<Lodging>> {
    const { page = 1, limit = 10, includeInactive = true } = query;

    const filters: QueryFilter<LodgingDocument> = {};

    if (!includeInactive) {
      filters.active = true;
    }

    if (role !== 'SUPERADMIN') {
      filters.ownerId = ownerId;
    }

    const [data, total] = await Promise.all([
      this.lodgingModel
        .find(filters)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.lodgingModel.countDocuments(filters),
    ]);

    return { data, total, page, limit };
  }

  async findAdminById(
    id: string,
    ownerId: string,
    role: UserRole,
  ): Promise<Lodging> {
    const filters: QueryFilter<LodgingDocument> = {
      _id: id,
    };

    if (role !== 'SUPERADMIN') {
      filters.ownerId = ownerId;
    }

    const lodging = await this.lodgingModel.findOne(filters);

    if (!lodging) {
      throw new DomainException(
        'Lodging not found',
        ERROR_CODES.LODGING_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return lodging;
  }

  async update(
    id: string,
    dto: UpdateLodgingDto,
    ownerId: string,
    role: UserRole,
  ): Promise<Lodging> {
    if (!Types.ObjectId.isValid(id)) {
      throw new DomainException(
        'Invalid lodging id',
        ERROR_CODES.INVALID_OBJECT_ID,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.occupiedRanges) {
      this.validateRanges(dto.occupiedRanges);
    }

    if (dto.contactId) {
      if (!Types.ObjectId.isValid(dto.contactId)) {
        throw new DomainException(
          'Invalid contact id',
          ERROR_CODES.INVALID_OBJECT_ID,
          HttpStatus.BAD_REQUEST,
        );
      }

      const contact = await this.contactModel.findOne({
        _id: dto.contactId,
        ownerId,
        active: true,
      });

      if (!contact) {
        throw new DomainException(
          'Contact not allowed',
          ERROR_CODES.CONTACT_NOT_ALLOWED,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    const filters: QueryFilter<LodgingDocument> = { _id: id };

    if (role !== 'SUPERADMIN') {
      filters.ownerId = ownerId;
    }

    const lodging = await this.lodgingModel.findOneAndUpdate(filters, dto, {
      new: true,
    });

    if (!lodging) {
      throw new DomainException(
        'Lodging not found',
        ERROR_CODES.LODGING_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return lodging;
  }

  async remove(
    id: string,
    ownerId: string,
    role: UserRole,
  ): Promise<{ deleted: boolean }> {
    const filters: QueryFilter<LodgingDocument> = {
      _id: id,
    };

    if (role !== 'SUPERADMIN') {
      filters.ownerId = ownerId;
    }

    const lodging = await this.lodgingModel.findOneAndDelete(filters);

    if (!lodging) {
      throw new DomainException(
        'Lodging not found',
        ERROR_CODES.LODGING_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return { deleted: true };
  }

  private validateRanges(ranges?: AvailabilityRangeDto[]) {
    if (!ranges) return;

    for (const range of ranges) {
      const from = new Date(range.from);
      const to = new Date(range.to);

      if (from > to) {
        throw new DomainException(
          'Invalid availability range: from must be before or equal to to',
          ERROR_CODES.INVALID_AVAILABILITY_RANGE,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }
}
