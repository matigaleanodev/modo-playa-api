// contacts/schemas/contact.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ContactDocument = HydratedDocument<Contact>;

@Schema({ timestamps: true })
export class Contact {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ trim: true })
  whatsapp?: string;

  @Prop({ default: false })
  isDefault!: boolean;

  @Prop({ default: true })
  active!: boolean;

  @Prop()
  notes?: string;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
