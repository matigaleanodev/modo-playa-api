import { BasicMediaUrlBuilderService } from './basic-media-url-builder.service';

describe('BasicMediaUrlBuilderService', () => {
  let service: BasicMediaUrlBuilderService;

  beforeEach(() => {
    service = new BasicMediaUrlBuilderService();
  });

  it('debe devolver la key sin modificaciones como URL pública', () => {
    const key = 'lodgings/abc/original.webp';

    expect(service.buildPublicUrl(key)).toBe(key);
  });

  it('debe devolver variantes con la misma key en modo básico', () => {
    const key = 'lodgings/abc/original.webp';

    expect(service.buildLodgingVariants(key)).toEqual({
      thumb: key,
      card: key,
      hero: key,
    });
  });
});
