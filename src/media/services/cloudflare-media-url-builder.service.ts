import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  MediaUrlBuilder,
  MediaUrlVariants,
} from '@media/interfaces/media-url-builder.interface';

@Injectable()
export class CloudflareMediaUrlBuilderService implements MediaUrlBuilder {
  private readonly baseUrl: string;
  private readonly supportsCloudflareImageResizing: boolean;

  constructor(private readonly configService: ConfigService) {
    const configured =
      this.configService.get<string>('MEDIA_PUBLIC_BASE_URL') ?? '';

    this.baseUrl = configured.replace(/\/+$/, '');
    this.supportsCloudflareImageResizing =
      this.detectCloudflareImageResizingSupport(this.baseUrl);
  }

  buildPublicUrl(key: string): string {
    if (this.isAbsoluteUrl(key)) {
      return key;
    }

    return `${this.baseUrl}/${this.normalizeKey(key)}`;
  }

  buildLodgingVariants(key: string): MediaUrlVariants {
    if (this.isAbsoluteUrl(key)) {
      return {
        thumb: key,
        card: key,
        hero: key,
      };
    }

    if (!this.supportsCloudflareImageResizing) {
      const originalUrl = this.buildPublicUrl(key);

      return {
        thumb: originalUrl,
        card: originalUrl,
        hero: originalUrl,
      };
    }

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

  private isAbsoluteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }

  private detectCloudflareImageResizingSupport(baseUrl: string): boolean {
    try {
      const hostname = new URL(baseUrl).hostname.toLowerCase();

      // r2.dev serves public objects, but does not support /cdn-cgi/image resizing paths.
      if (hostname.endsWith('.r2.dev')) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}
