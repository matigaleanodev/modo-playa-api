import { LodgingMapper } from './lodgings.mapper';

describe('LodgingMapper', () => {
  const mockMediaUrlBuilder = {
    buildPublicUrl: jest
      .fn()
      .mockImplementation((value: string) => `https://media.test/${value}`),
    buildLodgingVariants: jest.fn().mockImplementation((value: string) => ({
      thumb: `https://media.test/thumb/${value}`,
      card: `https://media.test/card/${value}`,
      hero: `https://media.test/hero/${value}`,
    })),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe exponer images completas desde mediaImages y occupiedRanges normalizados', () => {
    const result = LodgingMapper.toResponse(
      {
        _id: {
          toString: () => 'lodging-1',
        },
        title: 'Cabaña',
        description: 'Descripcion',
        location: 'Frente al mar',
        city: 'Villa Gesell',
        type: 'cabin',
        price: 100,
        priceUnit: 'night',
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        minNights: 2,
        distanceToBeach: 100,
        amenities: ['wifi'],
        mainImage: 'lodgings/legacy-main.webp',
        images: ['lodgings/legacy-main.webp'],
        mediaImages: [
          {
            imageId: 'img-1',
            key: 'lodgings/1/original.webp',
            isDefault: true,
            width: 1280,
            height: 720,
            bytes: 123456,
            mime: 'image/webp',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            imageId: 'img-2',
            key: 'lodgings/1/gallery.webp',
            isDefault: false,
            width: 1280,
            height: 720,
            bytes: 123456,
            mime: 'image/webp',
            createdAt: '2026-01-02T00:00:00.000Z',
          },
        ],
        occupiedRanges: [
          {
            from: new Date('2026-02-01T15:30:00.000Z'),
            to: new Date('2026-02-05T10:00:00.000Z'),
          },
        ],
      } as never,
      mockMediaUrlBuilder,
    );

    expect(result.mainImage).toBe(
      'https://media.test/lodgings/1/original.webp',
    );
    expect(result.images).toEqual([
      'https://media.test/lodgings/1/original.webp',
      'https://media.test/lodgings/1/gallery.webp',
    ]);
    expect(result.occupiedRanges).toEqual([
      { from: '2026-02-01', to: '2026-02-05' },
    ]);
  });

  it('debe mantener images legacy cuando no existen mediaImages', () => {
    const result = LodgingMapper.toResponse(
      {
        _id: {
          toString: () => 'lodging-2',
        },
        title: 'Depto',
        description: 'Descripcion',
        location: 'Centro',
        city: 'Pinamar',
        type: 'apartment',
        price: 80,
        priceUnit: 'night',
        maxGuests: 2,
        bedrooms: 1,
        bathrooms: 1,
        minNights: 1,
        amenities: [],
        mainImage: 'lodgings/2/main.webp',
        images: ['lodgings/2/main.webp', 'lodgings/2/extra.webp'],
        occupiedRanges: [],
      } as never,
      mockMediaUrlBuilder,
    );

    expect(result.images).toEqual([
      'https://media.test/lodgings/2/main.webp',
      'https://media.test/lodgings/2/extra.webp',
    ]);
    expect(result.occupiedRanges).toEqual([]);
  });
});
