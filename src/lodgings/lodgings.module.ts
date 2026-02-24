import { Module } from '@nestjs/common';
import { LodgingsService } from './lodgings.service';
import { LodgingsAdminController } from './controllers/lodgings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Lodging, LodgingSchema } from './schemas/lodging.schema';
import { Contact, ContactSchema } from '@contacts/schemas/contact.schema';
import { LodgingsPublicController } from './controllers/lodgings-public.controller';
import { MediaModule } from '@media/media.module';
import { LodgingImagesAdminController } from './controllers/lodging-images-admin.controller';
import { LodgingImagesService } from './services/lodging-images.service';
import { LodgingImagesPolicyService } from './domain/lodging-images-policy.service';

@Module({
  imports: [
    MediaModule,
    MongooseModule.forFeature([
      { name: Lodging.name, schema: LodgingSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
  ],
  controllers: [
    LodgingsAdminController,
    LodgingsPublicController,
    LodgingImagesAdminController,
  ],
  providers: [
    LodgingsService,
    LodgingImagesService,
    LodgingImagesPolicyService,
  ],
})
export class LodgingsModule {}
