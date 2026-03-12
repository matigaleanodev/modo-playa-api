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
import {
  PendingLodgingDraftImageUpload,
  PendingLodgingDraftImageUploadSchema,
} from './schemas/pending-lodging-draft-image-upload.schema';
import { LodgingDraftImageUploadsAdminController } from './controllers/lodging-draft-image-uploads.controller';

@Module({
  imports: [
    MediaModule,
    MongooseModule.forFeature([
      { name: Lodging.name, schema: LodgingSchema },
      { name: Contact.name, schema: ContactSchema },
      {
        name: PendingLodgingDraftImageUpload.name,
        schema: PendingLodgingDraftImageUploadSchema,
      },
    ]),
  ],
  controllers: [
    LodgingsAdminController,
    LodgingsPublicController,
    LodgingImagesAdminController,
    LodgingDraftImageUploadsAdminController,
  ],
  providers: [
    LodgingsService,
    LodgingImagesService,
    LodgingImagesPolicyService,
  ],
})
export class LodgingsModule {}
