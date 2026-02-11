import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  /* =========================
   * Ownership
   * ========================= */

  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
    default: () => new Types.ObjectId(),
  })
  ownerId!: Types.ObjectId;

  /* =========================
   * Credenciales
   * ========================= */

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
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

  /* =========================
   * Estado
   * ========================= */

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  lastLoginAt?: Date;

  /* =========================
   * UX (opcionales)
   * ========================= */

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  displayName?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  phone?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
