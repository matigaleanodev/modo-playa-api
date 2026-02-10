import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class AvailabilityRange {
  @Prop({ required: true })
  from!: Date;

  @Prop({ required: true })
  to!: Date;
}
