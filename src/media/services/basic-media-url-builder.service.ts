import { Injectable } from '@nestjs/common';
import {
  MediaUrlBuilder,
  MediaUrlVariants,
} from '@media/interfaces/media-url-builder.interface';

@Injectable()
export class BasicMediaUrlBuilderService implements MediaUrlBuilder {
  buildPublicUrl(key: string): string {
    return key;
  }

  buildLodgingVariants(key: string): MediaUrlVariants {
    return {
      thumb: key,
      card: key,
      hero: key,
    };
  }
}
