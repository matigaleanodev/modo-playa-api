import { Test, TestingModule } from '@nestjs/testing';
import { LodgingsPublicController } from './lodgings-public.controller';
import { LodgingsService } from '@lodgings/lodgings.service';
import { PublicLodgingsQueryDto } from '@lodgings/dto/pagination-query.dto';

describe('LodgingsPublicController', () => {
  let controller: LodgingsPublicController;
  let service: LodgingsService;

  const mockLodgingsService = {
    findPublicPaginated: jest.fn(),
    findPublicById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LodgingsPublicController],
      providers: [
        {
          provide: LodgingsService,
          useValue: mockLodgingsService,
        },
      ],
    }).compile();

    controller = module.get<LodgingsPublicController>(LodgingsPublicController);
    service = module.get<LodgingsService>(LodgingsService);
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
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockLodgingsService.findPublicPaginated.mockResolvedValue(mockResponse);

      const result = await controller.findAll(query);

      expect(service.findPublicPaginated).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findOne', () => {
    it('debe llamar a findPublicById con el id recibido', async () => {
      const id = '123abc';

      const mockLodging = { _id: id, title: 'Cabaña Mar Azul' };

      mockLodgingsService.findPublicById.mockResolvedValue(mockLodging);

      const result = await controller.findOne(id);

      expect(service.findPublicById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockLodging);
    });
  });
});
