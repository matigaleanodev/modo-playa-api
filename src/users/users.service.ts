import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { ERROR_CODES } from '@common/constants/error-code';
import { DomainException } from '@common/exceptions/domain.exception';
import { UserRole } from '@common/interfaces/role.interface';

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
  ): Promise<User> {
    if (role !== 'SUPERADMIN') {
      const count = await this.userModel.countDocuments({ ownerId });

      if (count >= 3) {
        throw new DomainException(
          'User limit reached for this owner',
          ERROR_CODES.USER_ALREADY_EXISTS,
          HttpStatus.CONFLICT,
        );
      }
    }

    const existingUser = await this.userModel.findOne({
      ownerId,
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
      ownerId,
      email: dto.email.toLowerCase(),
      username: dto.username.toLowerCase(),
      isPasswordSet: false,
      isActive: true,
    });

    return user.save();
  }

  async findAllByOwner(ownerId: string): Promise<User[]> {
    return this.userModel.find({ ownerId }).sort({ createdAt: 1 }).exec();
  }

  async findById(
    ownerId: string,
    userId: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({ _id: userId, ownerId });
  }

  async updateUser(
    ownerId: string,
    userId: string,
    dto: UpdateUserDto,
  ): Promise<User> {
    const updated = await this.userModel.findOneAndUpdate(
      { _id: userId, ownerId },
      { $set: dto },
      { new: true },
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
      { _id: userId, ownerId },
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
      { _id: userId, ownerId },
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
      { _id: userId },
      {
        resetPasswordCodeHash: codeHash,
        resetPasswordExpiresAt: expiresAt,
        resetPasswordAttempts: 0,
      },
    );
  }

  async incrementResetAttempts(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $inc: { resetPasswordAttempts: 1 } },
    );
  }

  async clearResetData(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      {
        resetPasswordCodeHash: null,
        resetPasswordExpiresAt: null,
        resetPasswordAttempts: 0,
      },
    );
  }
}
