import { Test, TestingModule } from '@nestjs/testing';
import { LodgingsPublicController } from './lodgings-public.controller';
import { LodgingsService } from '@lodgings/lodgings.service';
import { PublicLodgingsQueryDto } from '@lodgings/dto/pagination-query.dto';
import { MEDIA_URL_BUILDER } from '@media/constants/media.tokens';

describe('LodgingsPublicController', () => {
  let controller: LodgingsPublicController;

  const mockLodgingsService = {
    findPublicPaginated: jest.fn(),
    findPublicById: jest.fn(),
  };

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LodgingsPublicController],
      providers: [
        {
          provide: LodgingsService,
          useValue: mockLodgingsService,
        },
        {
          provide: MEDIA_URL_BUILDER,
          useValue: mockMediaUrlBuilder,
        },
      ],
    }).compile();

    controller = module.get<LodgingsPublicController>(LodgingsPublicController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debe llamar a findPublicPaginated con el query recibido', async () => {
      const query: PublicLodgingsQueryDto = {
        page: 1,
        limit: 10,
        search: 'mar',
        tag: ['pileta'],
      };

      const mockResponse = {
        data: [
          {
            _id: '1',
            title: 'Cabaña Mar Azul',
            mainImage: 'lodgings/1/original.webp',
            images: ['lodgings/1/original.webp'],
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockLodgingsService.findPublicPaginated.mockResolvedValue(mockResponse);

      const result = await controller.findAll(query);

      expect(mockLodgingsService.findPublicPaginated).toHaveBeenCalledWith(
        query,
      );

      expect(result).toEqual({
        ...mockResponse,
        data: [
          {
            id: '1',
            title: 'Cabaña Mar Azul',
            description: undefined,
            location: undefined,
            city: undefined,
            type: undefined,
            price: undefined,
            priceUnit: undefined,
            maxGuests: undefined,
            bedrooms: undefined,
            bathrooms: undefined,
            minNights: undefined,
            distanceToBeach: undefined,
            amenities: undefined,
            mainImage: 'https://media.test/lodgings/1/original.webp',
            images: ['https://media.test/lodgings/1/original.webp'],
          },
        ],
      });
    });
  });

  describe('findOne', () => {
    it('debe llamar a findPublicById con el id recibido', async () => {
      const id = '123abc';

      const mockLodging = {
        _id: id,
        title: 'Cabaña Mar Azul',
        mainImage: 'lodgings/123/original.webp',
        images: ['lodgings/123/original.webp'],
      };

      mockLodgingsService.findPublicById.mockResolvedValue(mockLodging);

      const result = await controller.findOne(id);

      expect(mockLodgingsService.findPublicById).toHaveBeenCalledWith(id);

      expect(result).toEqual({
        id,
        title: 'Cabaña Mar Azul',
        description: undefined,
        location: undefined,
        city: undefined,
        type: undefined,
        price: undefined,
        priceUnit: undefined,
        maxGuests: undefined,
        bedrooms: undefined,
        bathrooms: undefined,
        minNights: undefined,
        distanceToBeach: undefined,
        amenities: undefined,
        mainImage: 'https://media.test/lodgings/123/original.webp',
        images: ['https://media.test/lodgings/123/original.webp'],
      });
    });
  });
});
