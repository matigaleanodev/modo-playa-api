import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { ERROR_CODES } from '@common/constants/error-code';
import { DomainException } from '@common/exceptions/domain.exception';
import { UserRole } from '@common/interfaces/role.interface';
import { PaginatedResponse } from '@common/interfaces/pagination-response.interface';
import { UsersQueryDto } from './dto/users-query.dto';
import { toObjectIdOrThrow } from '@common/utils/object-id.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async createUser(
    ownerId: string,
    role: UserRole,
    dto: CreateUserDto,
  ): Promise<UserDocument> {
    const ownerObjectId = toObjectIdOrThrow(ownerId, {
      message: 'Invalid owner id',
      errorCode: ERROR_CODES.INVALID_OBJECT_ID,
      httpStatus: HttpStatus.BAD_REQUEST,
    });

    if (role !== 'SUPERADMIN') {
      const count = await this.userModel.countDocuments({
        ownerId: ownerObjectId,
      });

      if (count >= 3) {
        throw new DomainException(
          'User limit reached for this owner',
          ERROR_CODES.USER_ALREADY_EXISTS,
          HttpStatus.CONFLICT,
        );
      }
    }

    const existingUser = await this.userModel.findOne({
      ownerId: ownerObjectId,
      $or: [
        { email: dto.email.toLowerCase() },
        { username: dto.username.toLowerCase() },
      ],
    });

    if (existingUser) {
      throw new DomainException(
        'Ya existe un usuario con ese email o username',
        ERROR_CODES.USER_ALREADY_EXISTS,
        HttpStatus.CONFLICT,
      );
    }

    const user = new this.userModel({
      ownerId: ownerObjectId,
      email: dto.email.toLowerCase(),
      username: dto.username.toLowerCase(),
      isPasswordSet: false,
      isActive: true,
    });
    try {
      return await user.save();
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new DomainException(
          'Ya existe un usuario con ese email o username',
          ERROR_CODES.USER_ALREADY_EXISTS,
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  async findAllByOwner(
    ownerId: string,
    query: UsersQueryDto,
  ): Promise<PaginatedResponse<UserDocument>> {
    const { page = 1, limit = 10 } = query;
    const filters = {
      ownerId: toObjectIdOrThrow(ownerId, {
        message: 'Invalid owner id',
        errorCode: ERROR_CODES.INVALID_OBJECT_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      }),
    };

    const [data, total] = await Promise.all([
      this.userModel
        .find(filters)
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filters).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findById(ownerId: string, userId: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({
      _id: toObjectIdOrThrow(userId, {
        message: 'Invalid user id',
        errorCode: ERROR_CODES.INVALID_OBJECT_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      }),
      ownerId: toObjectIdOrThrow(ownerId, {
        message: 'Invalid owner id',
        errorCode: ERROR_CODES.INVALID_OBJECT_ID,
        httpStatus: HttpStatus.BAD_REQUEST,
      }),
    });

    if (!user) {
      throw new DomainException(
        'User not found',
        ERROR_CODES.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return user;
  }

  async updateUser(
    ownerId: string,
    userId: string,
    dto: UpdateUserDto,
  ): Promise<UserDocument> {
    const updated = await this.userModel.findOneAndUpdate(
      {
        _id: toObjectIdOrThrow(userId, {
          message: 'Invalid user id',
          errorCode: ERROR_CODES.INVALID_OBJECT_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
        ownerId: toObjectIdOrThrow(ownerId, {
          message: 'Invalid owner id',
          errorCode: ERROR_CODES.INVALID_OBJECT_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
      },
      { $set: dto },
      { new: true, runValidators: true },
    );

    if (!updated) {
      throw new DomainException(
        'User not found',
        ERROR_CODES.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return updated;
  }

  async deactivateUser(ownerId: string, userId: string): Promise<void> {
    await this.userModel.updateOne(
      {
        _id: toObjectIdOrThrow(userId, {
          message: 'Invalid user id',
          errorCode: ERROR_CODES.INVALID_OBJECT_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
        ownerId: toObjectIdOrThrow(ownerId, {
          message: 'Invalid owner id',
          errorCode: ERROR_CODES.INVALID_OBJECT_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
      },
      { $set: { isActive: false } },
    );
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username });
  }

  async setPassword(ownerId: string, userId: string, passwordHash: string) {
    return this.userModel.updateOne(
      {
        _id: toObjectIdOrThrow(userId, {
          message: 'Invalid user id',
          errorCode: ERROR_CODES.INVALID_OBJECT_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
        ownerId: toObjectIdOrThrow(ownerId, {
          message: 'Invalid owner id',
          errorCode: ERROR_CODES.INVALID_OBJECT_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
      },
      {
        passwordHash,
        isPasswordSet: true,
      },
    );
  }

  async setResetPasswordData(
    userId: string,
    codeHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userModel.updateOne(
      {
        _id: toObjectIdOrThrow(userId, {
          message: 'Invalid user id',
          errorCode: ERROR_CODES.INVALID_OBJECT_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
      },
      {
        resetPasswordCodeHash: codeHash,
        resetPasswordExpiresAt: expiresAt,
        resetPasswordAttempts: 0,
      },
    );
  }

  async incrementResetAttempts(userId: string): Promise<void> {
    await this.userModel.updateOne(
      {
        _id: toObjectIdOrThrow(userId, {
          message: 'Invalid user id',
          errorCode: ERROR_CODES.INVALID_OBJECT_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
      },
      { $inc: { resetPasswordAttempts: 1 } },
    );
  }

  async clearResetData(userId: string): Promise<void> {
    await this.userModel.updateOne(
      {
        _id: toObjectIdOrThrow(userId, {
          message: 'Invalid user id',
          errorCode: ERROR_CODES.INVALID_OBJECT_ID,
          httpStatus: HttpStatus.BAD_REQUEST,
        }),
      },
      {
        resetPasswordCodeHash: null,
        resetPasswordExpiresAt: null,
        resetPasswordAttempts: 0,
      },
    );
  }
}
