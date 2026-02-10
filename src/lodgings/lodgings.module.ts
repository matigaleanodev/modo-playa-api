import { Module } from '@nestjs/common';
import { LodgingsService } from './lodgings.service';
import { LodgingsController } from './lodgings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Lodging, LodgingSchema } from './schemas/lodging.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lodging.name, schema: LodgingSchema }]),
  ],
  controllers: [LodgingsController],
  providers: [LodgingsService],
})
export class LodgingsModule {}
