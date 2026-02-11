import { Module } from '@nestjs/common';
import { LodgingsService } from './lodgings.service';
import { LodgingsController } from './lodgings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Lodging, LodgingSchema } from './schemas/lodging.schema';
import { Contact, ContactSchema } from '@contacts/schemas/contact.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lodging.name, schema: LodgingSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
  ],
  controllers: [LodgingsController],
  providers: [LodgingsService],
})
export class LodgingsModule {}
