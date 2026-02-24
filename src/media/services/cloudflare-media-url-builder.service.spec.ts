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
});
