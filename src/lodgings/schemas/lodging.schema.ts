// lodgings/schemas/lodging.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AvailabilityRange } from './availability-range.schema';

export type LodgingDocument = HydratedDocument<Lodging>;

export enum LodgingType {
  CABIN = 'cabin',
  APARTMENT = 'apartment',
  HOUSE = 'house',
}

@Schema({ timestamps: true })
export class Lodging {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, trim: true })
  location!: string;

  @Prop({
    required: true,
    enum: LodgingType,
  })
  type!: LodgingType;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ required: true })
  mainImage!: string;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({
    type: [AvailabilityRange],
    default: [],
  })
  occupiedRanges!: AvailabilityRange[];

  @Prop({ type: Types.ObjectId, ref: 'Contact' })
  contactId?: Types.ObjectId;

  @Prop({ default: true })
  active!: boolean;
}

export const LodgingSchema = SchemaFactory.createForClass(Lodging);
