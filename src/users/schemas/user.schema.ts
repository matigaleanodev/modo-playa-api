import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  UserProfileImage,
  UserProfileImageSchema,
} from './user-profile-image.schema';
import {
  PendingUserProfileImageUpload,
  PendingUserProfileImageUploadSchema,
} from './pending-user-profile-image-upload.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: Types.ObjectId,
    required: true,
    default: () => new Types.ObjectId(),
  })
  ownerId!: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  username!: string;

  @Prop()
  passwordHash?: string;

  @Prop({ default: false })
  isPasswordSet!: boolean;

  @Prop()
  resetPasswordCodeHash?: string;

  @Prop()
  resetPasswordExpiresAt?: Date;

  @Prop({ default: 0 })
  resetPasswordAttempts!: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  displayName?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({
    type: UserProfileImageSchema,
    required: false,
  })
  profileImage?: UserProfileImage;

  @Prop({
    type: [PendingUserProfileImageUploadSchema],
    default: [],
  })
  pendingProfileImageUploads!: PendingUserProfileImageUpload[];

  @Prop()
  phone?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ ownerId: 1 });

UserSchema.index({ ownerId: 1, email: 1 }, { unique: true });

UserSchema.index({ ownerId: 1, username: 1 }, { unique: true });
