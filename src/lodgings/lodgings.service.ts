import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLodgingDto } from './dto/create-lodging.dto';
import { UpdateLodgingDto } from './dto/update-lodging.dto';
import { Contact, ContactDocument } from '@contacts/schemas/contact.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lodging, LodgingDocument } from './schemas/lodging.schema';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { AvailabilityRangeDto } from './dto/availability-range.dto';
import { DomainException } from '@common/exceptions/domain.exception';
import { ERROR_CODES } from '@common/constants/error-code';

@Injectable()
export class LodgingsService {
  constructor(
    @InjectModel(Lodging.name)
    private readonly lodgingModel: Model<LodgingDocument>,

    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
  ) {}

  async create(dto: CreateLodgingDto): Promise<Lodging> {
    this.validateRanges(dto.occupiedRanges);

    let contactId: Types.ObjectId | undefined;

    if (dto.contactId) {
      contactId = new Types.ObjectId(dto.contactId);
    } else {
      const defaultContact = await this.contactModel.findOne({
        isDefault: true,
        active: true,
      });

      if (defaultContact) {
        contactId = defaultContact._id;
      }
    }

    const lodging = new this.lodgingModel({
      ...dto,
      contactId,
    });

    return lodging.save();
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter = query.includeInactive ? {} : { active: true };

    const [data, total] = await Promise.all([
      this.lodgingModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.lodgingModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: skip + data.length < total,
      },
    };
  }

  async findOne(id: string, includeInactive = false) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Lodging not found');
    }

    const filter = includeInactive ? { _id: id } : { _id: id, active: true };

    const lodging = await this.lodgingModel.findOne(filter);

    if (!lodging) {
      throw new NotFoundException('Lodging not found');
    }

    return lodging;
  }

  async update(id: string, dto: UpdateLodgingDto, includeInactive = false) {
    if (dto.occupiedRanges !== undefined) {
      this.validateRanges(dto.occupiedRanges);
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Lodging not found');
    }

    let contactId = dto.contactId
      ? new Types.ObjectId(dto.contactId)
      : undefined;

    if (!contactId && dto.contactId === undefined) {
      const defaultContact = await this.contactModel.findOne({
        isDefault: true,
        active: true,
      });

      if (defaultContact) {
        contactId = defaultContact._id;
      }
    }

    const filter = includeInactive ? { _id: id } : { _id: id, active: true };

    const updated = await this.lodgingModel.findOneAndUpdate(
      filter,
      {
        ...dto,
        ...(contactId !== undefined && { contactId }),
      },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Lodging not found');
    }

    return updated;
  }

  async remove(id: string, includeInactive = false) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Lodging not found');
    }

    const filter = includeInactive ? { _id: id } : { _id: id, active: true };

    const updated = await this.lodgingModel.findOneAndUpdate(
      filter,
      { active: false },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Lodging not found');
    }

    return updated;
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
