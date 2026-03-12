import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateLodgingDto } from './dto/create-lodging.dto';
import { UpdateLodgingDto } from './dto/update-lodging.dto';
import { Contact, ContactDocument } from '@contacts/schemas/contact.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
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
import { toObjectIdOrThrow } from '@common/utils/object-id.util';
import { escapeRegex } from '@common/utils/regex.util';
import { LodgingImagesService } from '@lodgings/services/lodging-images.service';

@Injectable()
export class LodgingsService {
  private readonly contactPopulate = {
    path: 'contactId',
    select: 'name email whatsapp isDefault active notes',
  } as const;

  constructor(
    @InjectModel(Lodging.name)
    private readonly lodgingModel: Model<LodgingDocument>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
    private readonly lodgingImagesService: LodgingImagesService,
  ) {}

  async create(
    dto: CreateLodgingDto,
    requesterOwnerId: string,
    role: UserRole = 'OWNER',
  ): Promise<LodgingDocument> {
    this.validateRanges(dto.occupiedRanges);

    const ownerObjectId = this.resolveTargetOwnerId(
      requesterOwnerId,
      role,
      dto.targetOwnerId,
    );
    const contactId = await this.resolveContactId(ownerObjectId, dto.contactId);
    const {
      pendingImageIds,
      uploadSessionId,
      mainImage,
      images,
      ...persistedDto
    } = dto;

    const lodging = new this.lodgingModel({
      ...persistedDto,
      ownerId: ownerObjectId,
      contactId,
      mainImage: mainImage?.trim() || 'lodgings/default-placeholder.webp',
      images: images ?? [],
    });
    const saved = await lodging.save();

    try {
      if (pendingImageIds?.length) {
        if (!uploadSessionId) {
          throw new DomainException(
            'uploadSessionId is required when pendingImageIds are provided',
            ERROR_CODES.LODGING_IMAGE_INVALID_STATE,
            HttpStatus.BAD_REQUEST,
          );
        }

        await this.lodgingImagesService.attachDraftUploadsToLodging(
          saved._id.toString(),
          ownerObjectId.toString(),
          uploadSessionId,
          pendingImageIds,
        );
      }
    } catch (error) {
      await this.lodgingModel.deleteOne({ _id: saved._id });
      throw error;
    }

    return this.findAdminById(
      saved._id.toString(),
      ownerObjectId.toString(),
      role,
    );
  }

  async findPublicPaginated(
    query: PublicLodgingsQueryDto,
  ): Promise<PaginatedResponse<LodgingDocument>> {
    const {
      page = 1,
      limit = 10,
      search,
      city,
      minGuests,
      minPrice,
      maxPrice,
      amenities,
      tag,
    } = query;

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      throw new DomainException(
        'minPrice cannot be greater than maxPrice',
        ERROR_CODES.INVALID_OBJECT_ID,
        HttpStatus.BAD_REQUEST,
      );
    }

    const filters: QueryFilter<LodgingDocument> = {
      active: true,
    };

    if (search) {
      const escapedSearch = escapeRegex(search);
      filters.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { tags: { $regex: escapedSearch, $options: 'i' } },
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

    if (tag && tag.length > 0) {
      filters.tags = { $all: Array.from(new Set(tag)) };
    }

    const [data, total] = await Promise.all([
      this.lodgingModel
        .find(filters)
        .populate(this.contactPopulate)
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

  async findPublicById(id: string): Promise<LodgingDocument> {
    const lodging = await this.lodgingModel
      .findOne({
        _id: toObjectIdOrThrow(id, {
          message: 'Invalid lodging id',
          errorCode: ERROR_CODES.INVALID_OBJECT_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
        active: true,
      })
      .populate(this.contactPopulate);

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
  ): Promise<PaginatedResponse<LodgingDocument>> {
    const { page = 1, limit = 10, includeInactive = true } = query;
    const ownerObjectId = toObjectIdOrThrow(ownerId, {
      message: 'Invalid owner id',
      errorCode: ERROR_CODES.INVALID_OBJECT_ID,
      httpStatus: HttpStatus.BAD_REQUEST,
    });

    const filters: QueryFilter<LodgingDocument> = {};

    if (!includeInactive) {
      filters.active = true;
    }

    if (role !== 'SUPERADMIN') {
      filters.ownerId = ownerObjectId;
    }

    const [data, total] = await Promise.all([
      this.lodgingModel
        .find(filters)
        .populate(this.contactPopulate)
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
  ): Promise<LodgingDocument> {
    const filters: QueryFilter<LodgingDocument> = {
      _id: toObjectIdOrThrow(id, {
        message: 'Invalid lodging id',
        errorCode: ERROR_CODES.INVALID_OBJECT_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      }),
    };

    if (role !== 'SUPERADMIN') {
      filters.ownerId = toObjectIdOrThrow(ownerId, {
        message: 'Invalid owner id',
        errorCode: ERROR_CODES.INVALID_OBJECT_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      });
    }

    const lodging = await this.lodgingModel
      .findOne(filters)
      .populate(this.contactPopulate);

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
  ): Promise<LodgingDocument> {
    if (Object.prototype.hasOwnProperty.call(dto as object, 'occupiedRanges')) {
      throw new DomainException(
        'occupiedRanges must be managed using availability endpoints',
        ERROR_CODES.INVALID_AVAILABILITY_RANGE,
        HttpStatus.BAD_REQUEST,
      );
    }

    const ownerObjectId = toObjectIdOrThrow(ownerId, {
      message: 'Invalid owner id',
      errorCode: ERROR_CODES.INVALID_OBJECT_ID,
      httpStatus: HttpStatus.BAD_REQUEST,
    });
    const lodgingObjectId = toObjectIdOrThrow(id, {
      message: 'Invalid lodging id',
      errorCode: ERROR_CODES.INVALID_OBJECT_ID,
      httpStatus: HttpStatus.BAD_REQUEST,
    });

    if (dto.contactId) {
      await this.resolveContactId(ownerObjectId, dto.contactId);
    }

    const filters: QueryFilter<LodgingDocument> = {
      _id: lodgingObjectId,
    };

    if (role !== 'SUPERADMIN') {
      filters.ownerId = ownerObjectId;
    }

    const lodging = await this.lodgingModel
      .findOneAndUpdate(filters, dto, {
        returnDocument: 'after',
        runValidators: true,
      })
      .populate(this.contactPopulate);

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
      _id: toObjectIdOrThrow(id, {
        message: 'Invalid lodging id',
        errorCode: ERROR_CODES.INVALID_OBJECT_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      }),
    };

    if (role !== 'SUPERADMIN') {
      filters.ownerId = toObjectIdOrThrow(ownerId, {
        message: 'Invalid owner id',
        errorCode: ERROR_CODES.INVALID_OBJECT_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      });
    }

    const lodging = await this.lodgingModel.findOne(filters);

    if (!lodging) {
      throw new DomainException(
        'Lodging not found',
        ERROR_CODES.LODGING_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    lodging.active = false;
    await lodging.save();

    return { deleted: true };
  }

  async getOccupiedRanges(
    id: string,
    ownerId: string,
    role: UserRole,
  ): Promise<AvailabilityRangeDto[]> {
    const lodging = await this.findAdminById(id, ownerId, role);

    return this.toAvailabilityRangeDtos(lodging.occupiedRanges);
  }

  async addOccupiedRange(
    id: string,
    range: AvailabilityRangeDto,
    ownerId: string,
    role: UserRole,
  ): Promise<AvailabilityRangeDto[]> {
    const lodging = await this.findAdminById(id, ownerId, role);
    const normalizedNewRange = this.normalizeAndValidateRange(range);

    this.ensureNoRangeConflicts(
      normalizedNewRange,
      lodging.occupiedRanges ?? [],
    );

    lodging.occupiedRanges = [
      ...(lodging.occupiedRanges ?? []),
      normalizedNewRange,
    ].sort((a, b) => a.from.getTime() - b.from.getTime());

    await lodging.save();

    return this.toAvailabilityRangeDtos(lodging.occupiedRanges);
  }

  async removeOccupiedRange(
    id: string,
    range: AvailabilityRangeDto,
    ownerId: string,
    role: UserRole,
  ): Promise<AvailabilityRangeDto[]> {
    const lodging = await this.findAdminById(id, ownerId, role);
    const normalizedTarget = this.normalizeAndValidateRange(range);
    const beforeCount = lodging.occupiedRanges?.length ?? 0;

    lodging.occupiedRanges = (lodging.occupiedRanges ?? []).filter(
      (existingRange) => {
        const normalizedExisting = this.normalizeRangeDates(existingRange);
        return !(
          normalizedExisting.from.getTime() ===
            normalizedTarget.from.getTime() &&
          normalizedExisting.to.getTime() === normalizedTarget.to.getTime()
        );
      },
    );

    if ((lodging.occupiedRanges?.length ?? 0) === beforeCount) {
      throw new DomainException(
        'Occupied range not found',
        ERROR_CODES.INVALID_AVAILABILITY_RANGE,
        HttpStatus.BAD_REQUEST,
      );
    }

    await lodging.save();

    return this.toAvailabilityRangeDtos(lodging.occupiedRanges);
  }

  private async resolveContactId(
    ownerObjectId: Types.ObjectId,
    contactId?: string,
  ): Promise<Types.ObjectId | undefined> {
    if (contactId) {
      if (!Types.ObjectId.isValid(contactId)) {
        throw new DomainException(
          'Invalid contact id',
          ERROR_CODES.INVALID_OBJECT_ID,
          HttpStatus.BAD_REQUEST,
        );
      }

      const contact = await this.contactModel.findOne({
        _id: new Types.ObjectId(contactId),
        ownerId: ownerObjectId,
        active: true,
      });

      if (!contact) {
        throw new DomainException(
          'Contact not found or not allowed',
          ERROR_CODES.CONTACT_NOT_ALLOWED,
          HttpStatus.NOT_FOUND,
        );
      }

      return contact._id;
    }

    const defaultContact = await this.contactModel.findOne({
      ownerId: ownerObjectId,
      isDefault: true,
      active: true,
    });

    return defaultContact?._id;
  }

  private validateRanges(ranges?: AvailabilityRangeDto[]) {
    if (!ranges) return;

    const normalizedRanges = ranges.map((range) =>
      this.normalizeAndValidateRange(range),
    );

    for (let i = 0; i < normalizedRanges.length; i += 1) {
      for (let j = i + 1; j < normalizedRanges.length; j += 1) {
        if (this.isOverlappingRange(normalizedRanges[i], normalizedRanges[j])) {
          throw new DomainException(
            'Invalid availability range: overlapping ranges are not allowed',
            ERROR_CODES.OCCUPIED_RANGE_CONFLICT,
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }
  }

  private ensureNoRangeConflicts(
    newRange: { from: Date; to: Date },
    existingRanges: { from: Date; to: Date }[],
  ) {
    for (const existingRange of existingRanges) {
      const normalizedExistingRange = this.normalizeRangeDates(existingRange);

      if (this.isOverlappingRange(newRange, normalizedExistingRange)) {
        throw new DomainException(
          'Occupied range overlaps with existing availability',
          ERROR_CODES.OCCUPIED_RANGE_CONFLICT,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  private isOverlappingRange(
    first: { from: Date; to: Date },
    second: { from: Date; to: Date },
  ): boolean {
    return first.from <= second.to && first.to >= second.from;
  }

  private normalizeAndValidateRange(range: AvailabilityRangeDto): {
    from: Date;
    to: Date;
  } {
    const normalizedRange = this.normalizeRangeDates(range);

    if (normalizedRange.from > normalizedRange.to) {
      throw new DomainException(
        'Invalid availability range: from must be before or equal to to',
        ERROR_CODES.INVALID_AVAILABILITY_RANGE,
        HttpStatus.BAD_REQUEST,
      );
    }

    return normalizedRange;
  }

  private normalizeRangeDates(range: {
    from: Date | string;
    to: Date | string;
  }): { from: Date; to: Date } {
    return {
      from: this.normalizeToUtcStartOfDay(range.from),
      to: this.normalizeToUtcStartOfDay(range.to),
    };
  }

  private normalizeToUtcStartOfDay(value: Date | string): Date {
    const date = new Date(value);

    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private toAvailabilityRangeDtos(
    ranges: { from: Date; to: Date }[],
  ): AvailabilityRangeDto[] {
    return (ranges ?? []).map((range) => {
      const normalizedRange = this.normalizeRangeDates(range);
      return {
        from: normalizedRange.from.toISOString().slice(0, 10),
        to: normalizedRange.to.toISOString().slice(0, 10),
      };
    });
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
      errorCode: ERROR_CODES.INVALID_OBJECT_ID,
      httpStatus: HttpStatus.BAD_REQUEST,
    });
  }
}
