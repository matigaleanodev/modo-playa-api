import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false, versionKey: false })
export class PendingUserProfileImageUpload {
  @Prop({ required: true })
  imageId!: string;

  @Prop({ required: true })
  stagingKey!: string;

  @Prop({ required: true, default: () => new Date() })
  createdAt!: Date;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ required: true, enum: ['PENDING'], default: 'PENDING' })
  status!: 'PENDING';
}

export const PendingUserProfileImageUploadSchema = SchemaFactory.createForClass(
  PendingUserProfileImageUpload,
);
