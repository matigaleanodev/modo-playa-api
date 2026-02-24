import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AvailabilityRange } from './availability-range.schema';
import { LodgingAmenity } from '@lodgings/enums/amenities.enum';
import { LodgingType } from '@lodgings/enums/lodging-type.enum';
import { PriceUnit } from '@lodgings/enums/price-unit.enum';
import { Contact } from '@contacts/schemas/contact.schema';
import { LodgingImage, LodgingImageSchema } from './lodging-image.schema';
import {
  PendingLodgingImageUpload,
  PendingLodgingImageUploadSchema,
} from './pending-lodging-image-upload.schema';

export type LodgingDocument = HydratedDocument<Lodging>;

@Schema({ timestamps: true })
export class Lodging {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, trim: true })
  location!: string;

  @Prop({ required: true, trim: true })
  city!: string;

  @Prop({
    type: String,
    enum: LodgingType,
    required: true,
  })
  type!: LodgingType;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  price!: number;

  @Prop({
    type: String,
    enum: PriceUnit,
    required: true,
  })
  priceUnit!: PriceUnit;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  maxGuests!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  bedrooms!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  bathrooms!: number;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  minNights!: number;

  @Prop({
    type: Number,
    min: 0,
  })
  distanceToBeach?: number;

  @Prop({
    type: [String],
    enum: LodgingAmenity,
    default: [],
  })
  amenities!: LodgingAmenity[];

  @Prop({ required: true })
  mainImage!: string;

  @Prop({
    type: [String],
    default: [],
  })
  images!: string[];

  // Transición: nuevo modelo de imágenes procesadas con metadata (R2 + confirm).
  @Prop({
    type: [LodgingImageSchema],
    default: [],
  })
  mediaImages!: LodgingImage[];

  @Prop({
    type: [PendingLodgingImageUploadSchema],
    default: [],
  })
  pendingImageUploads!: PendingLodgingImageUpload[];

  @Prop({
    type: [AvailabilityRange],
    default: [],
  })
  occupiedRanges!: AvailabilityRange[];

  @Prop({ type: Types.ObjectId, ref: Contact.name })
  contactId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
  })
  ownerId!: Types.ObjectId;

  @Prop({
    default: true,
  })
  active!: boolean;
}

export const LodgingSchema = SchemaFactory.createForClass(Lodging);

LodgingSchema.index({ active: 1, createdAt: -1 });
LodgingSchema.index({ active: 1, city: 1, createdAt: -1 });
LodgingSchema.index({ active: 1, price: 1 });
LodgingSchema.index({ active: 1, maxGuests: 1 });
