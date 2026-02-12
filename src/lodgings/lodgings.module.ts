import { Module } from '@nestjs/common';
import { LodgingsService } from './lodgings.service';
import { LodgingsAdminController } from './controllers/lodgings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Lodging, LodgingSchema } from './schemas/lodging.schema';
import { Contact, ContactSchema } from '@contacts/schemas/contact.schema';
import { LodgingsPublicController } from './controllers/lodgings-public.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lodging.name, schema: LodgingSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
  ],
  controllers: [LodgingsAdminController, LodgingsPublicController],
  providers: [LodgingsService],
})
export class LodgingsModule {}
