import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PendingLodgingDraftImageUploadDocument =
  HydratedDocument<PendingLodgingDraftImageUpload>;

@Schema({ timestamps: true, versionKey: false })
export class PendingLodgingDraftImageUpload {
  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
  })
  ownerId!: Types.ObjectId;

  @Prop({ required: true, index: true, trim: true })
  uploadSessionId!: string;

  @Prop({ required: true })
  imageId!: string;

  @Prop({ required: true })
  stagingKey!: string;

  createdAt!: Date;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ required: true, enum: ['PENDING', 'CONFIRMED'], default: 'PENDING' })
  status!: 'PENDING' | 'CONFIRMED';
}

export const PendingLodgingDraftImageUploadSchema =
  SchemaFactory.createForClass(PendingLodgingDraftImageUpload);

PendingLodgingDraftImageUploadSchema.index(
  { ownerId: 1, uploadSessionId: 1, imageId: 1 },
  { unique: true },
);
PendingLodgingDraftImageUploadSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);
