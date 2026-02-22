import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContactDocument = Contact & Document;

@Schema({ timestamps: true })
export class Contact {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ trim: true })
  whatsapp?: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  ownerId!: Types.ObjectId;

  @Prop({ default: false })
  isDefault!: boolean;

  @Prop({ default: true })
  active!: boolean;

  @Prop()
  notes?: string;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);

ContactSchema.index(
  { ownerId: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true },
  },
);
