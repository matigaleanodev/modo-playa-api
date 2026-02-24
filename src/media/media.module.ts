import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  IMAGE_PROCESSOR_SERVICE,
  MEDIA_URL_BUILDER,
  OBJECT_STORAGE_SERVICE,
} from './constants/media.tokens';
import { R2ObjectStorageService } from './services/r2-object-storage.service';
import { SharpImageProcessorService } from './services/sharp-image-processor.service';
import { CloudflareMediaUrlBuilderService } from './services/cloudflare-media-url-builder.service';
import { R2HealthService } from './services/r2-health.service';
import { MediaHealthController } from './controllers/media-health.controller';

@Module({
  imports: [ConfigModule],
  controllers: [MediaHealthController],
  providers: [
    {
      provide: OBJECT_STORAGE_SERVICE,
      useClass: R2ObjectStorageService,
    },
    {
      provide: IMAGE_PROCESSOR_SERVICE,
      useClass: SharpImageProcessorService,
    },
    {
      provide: MEDIA_URL_BUILDER,
      useClass: CloudflareMediaUrlBuilderService,
    },
    R2HealthService,
  ],
  exports: [
    OBJECT_STORAGE_SERVICE,
    IMAGE_PROCESSOR_SERVICE,
    MEDIA_URL_BUILDER,
    R2HealthService,
  ],
})
export class MediaModule {}
