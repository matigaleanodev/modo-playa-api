import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  MediaUrlBuilder,
  MediaUrlVariants,
} from '@media/interfaces/media-url-builder.interface';

@Injectable()
export class CloudflareMediaUrlBuilderService implements MediaUrlBuilder {
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const configured =
      this.configService.get<string>('MEDIA_PUBLIC_BASE_URL') ?? '';

    this.baseUrl = configured.replace(/\/+$/, '');
  }

  buildPublicUrl(key: string): string {
    return `${this.baseUrl}/${this.normalizeKey(key)}`;
  }

  buildLodgingVariants(key: string): MediaUrlVariants {
    const normalizedKey = this.normalizeKey(key);

    return {
      thumb: this.buildTransformationUrl(
        'width=320,height=240,fit=cover,quality=80,format=auto',
        normalizedKey,
      ),
      card: this.buildTransformationUrl(
        'width=640,height=420,fit=cover,quality=82,format=auto',
        normalizedKey,
      ),
      hero: this.buildTransformationUrl(
        'width=1600,height=900,fit=cover,quality=85,format=auto',
        normalizedKey,
      ),
    };
  }

  private buildTransformationUrl(
    options: string,
    normalizedKey: string,
  ): string {
    return `${this.baseUrl}/cdn-cgi/image/${options}/${normalizedKey}`;
  }

  private normalizeKey(key: string): string {
    return key
      .split('/')
      .filter((segment) => segment.length > 0)
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  }
}
