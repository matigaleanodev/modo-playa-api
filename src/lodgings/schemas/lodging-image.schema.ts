import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false, versionKey: false })
export class LodgingImage {
  @Prop({ required: true })
  imageId!: string;

  @Prop({ required: true })
  key!: string;

  @Prop({ required: true, default: false })
  isDefault!: boolean;

  @Prop()
  width?: number;

  @Prop()
  height?: number;

  @Prop()
  bytes?: number;

  @Prop()
  mime?: string;

  @Prop({ required: true, default: () => new Date() })
  createdAt!: Date;
}

export const LodgingImageSchema = SchemaFactory.createForClass(LodgingImage);
