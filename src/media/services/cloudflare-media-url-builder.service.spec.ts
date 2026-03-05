import { ConfigService } from '@nestjs/config';
import { CloudflareMediaUrlBuilderService } from './cloudflare-media-url-builder.service';

describe('CloudflareMediaUrlBuilderService', () => {
  it('debe construir URL pública usando MEDIA_PUBLIC_BASE_URL', () => {
    const configService = {
      get: jest.fn().mockReturnValue('https://media.example.com/'),
    } as unknown as ConfigService;

    const service = new CloudflareMediaUrlBuilderService(configService);

    expect(service.buildPublicUrl('lodgings/a b/original.webp')).toBe(
      'https://media.example.com/lodgings/a%20b/original.webp',
    );
  });

  it('debe construir variantes de Cloudflare con /cdn-cgi/image', () => {
    const configService = {
      get: jest.fn().mockReturnValue('https://media.example.com'),
    } as unknown as ConfigService;

    const service = new CloudflareMediaUrlBuilderService(configService);
    const variants = service.buildLodgingVariants('lodgings/abc/original.webp');

    expect(variants.thumb).toContain('/cdn-cgi/image/');
    expect(variants.card).toContain('/cdn-cgi/image/');
    expect(variants.hero).toContain('/cdn-cgi/image/');
    expect(variants.thumb).toContain('lodgings/abc/original.webp');
  });

  it('debe devolver variantes sin /cdn-cgi/image cuando MEDIA_PUBLIC_BASE_URL es r2.dev', () => {
    const configService = {
      get: jest.fn().mockReturnValue('https://modo-playa-media.r2.dev'),
    } as unknown as ConfigService;

    const service = new CloudflareMediaUrlBuilderService(configService);
    const variants = service.buildLodgingVariants('lodgings/abc/original.webp');

    expect(variants).toEqual({
      thumb: 'https://modo-playa-media.r2.dev/lodgings/abc/original.webp',
      card: 'https://modo-playa-media.r2.dev/lodgings/abc/original.webp',
      hero: 'https://modo-playa-media.r2.dev/lodgings/abc/original.webp',
    });
  });

  it('debe evitar doble concatenación cuando recibe una URL absoluta', () => {
    const configService = {
      get: jest.fn().mockReturnValue('https://media.example.com'),
    } as unknown as ConfigService;

    const service = new CloudflareMediaUrlBuilderService(configService);
    const url = 'https://cdn.example.org/lodgings/abc/original.webp';

    expect(service.buildPublicUrl(url)).toBe(url);
    expect(service.buildLodgingVariants(url)).toEqual({
      thumb: url,
      card: url,
      hero: url,
    });
  });

  it('debe convertir URL firmada de R2 a URL pública estable', () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'MEDIA_PUBLIC_BASE_URL') {
          return 'https://pub-123.r2.dev';
        }
        if (key === 'R2_ENDPOINT') {
          return 'https://abc123.r2.cloudflarestorage.com';
        }
        if (key === 'R2_BUCKET') {
          return 'modo-playa-media';
        }
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new CloudflareMediaUrlBuilderService(configService);
    const signedUrl =
      'https://abc123.r2.cloudflarestorage.com/modo-playa-media/lodgings/abc/original.webp?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=xyz';

    expect(service.buildPublicUrl(signedUrl)).toBe(
      'https://pub-123.r2.dev/lodgings/abc/original.webp',
    );
  });

  it('debe construir variantes desde URL firmada convertible', () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'MEDIA_PUBLIC_BASE_URL') {
          return 'https://media.example.com';
        }
        if (key === 'R2_ENDPOINT') {
          return 'https://abc123.r2.cloudflarestorage.com';
        }
        if (key === 'R2_BUCKET') {
          return 'modo-playa-media';
        }
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new CloudflareMediaUrlBuilderService(configService);
    const signedUrl =
      'https://abc123.r2.cloudflarestorage.com/modo-playa-media/lodgings/abc/original.webp?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=xyz';
    const variants = service.buildLodgingVariants(signedUrl);

    expect(variants.thumb).toContain('/cdn-cgi/image/');
    expect(variants.card).toContain('/cdn-cgi/image/');
    expect(variants.hero).toContain('/cdn-cgi/image/');
    expect(variants.thumb).toContain('lodgings/abc/original.webp');
  });
});
