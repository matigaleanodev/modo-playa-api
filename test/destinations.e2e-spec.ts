import { INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DestinationsController } from '../src/destinations/destinations.controller';
import { DestinationsService } from '../src/destinations/destinations.service';
import { DestinationId } from '../src/destinations/providers/destination-id.enum';
import { ERROR_CODES } from '../src/common/constants/error-code';
import { createAppValidationPipe } from '../src/common/pipes/app-validation.pipe';

const mockDestinationsService = {
  getAll: jest.fn(),
  getContext: jest.fn(),
};

@Module({
  controllers: [DestinationsController],
  providers: [
    {
      provide: DestinationsService,
      useValue: mockDestinationsService,
    },
  ],
})
class TestDestinationsModule {}

describe('Destinations endpoint (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestDestinationsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(createAppValidationPipe());
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/destinations devuelve lista de destinos', async () => {
    mockDestinationsService.getAll.mockReturnValue([
      {
        id: DestinationId.GESELL,
        name: 'Villa Gesell',
      },
      {
        id: DestinationId.PAMPAS,
        name: 'Mar de las Pampas',
      },
      {
        id: DestinationId.MAR_AZUL,
        name: 'Mar Azul',
      },
    ]);

    await request(app.getHttpServer())
      .get('/api/destinations')
      .expect(200)
      .expect([
        {
          id: DestinationId.GESELL,
          name: 'Villa Gesell',
        },
        {
          id: DestinationId.PAMPAS,
          name: 'Mar de las Pampas',
        },
        {
          id: DestinationId.MAR_AZUL,
          name: 'Mar Azul',
        },
      ]);
  });

  it('GET /api/destinations/:id/context devuelve contexto del destino', async () => {
    mockDestinationsService.getContext.mockResolvedValue({
      destinationId: DestinationId.PAMPAS,
      destination: 'Mar de las Pampas',
      timezone: 'America/Argentina/Buenos_Aires',
      weather: {
        temperature: 27,
        windSpeed: 14,
        weatherCode: 3,
      },
      forecast: [
        { day: 'today', max: 28, min: 19 },
        { day: 'tomorrow', max: 27, min: 18 },
      ],
      sun: {
        sunrise: '06:12',
        sunset: '20:05',
      },
    });

    await request(app.getHttpServer())
      .get('/api/destinations/pampas/context')
      .expect(200)
      .expect({
        destinationId: DestinationId.PAMPAS,
        destination: 'Mar de las Pampas',
        timezone: 'America/Argentina/Buenos_Aires',
        weather: {
          temperature: 27,
          windSpeed: 14,
          weatherCode: 3,
        },
        forecast: [
          { day: 'today', max: 28, min: 19 },
          { day: 'tomorrow', max: 27, min: 18 },
        ],
        sun: {
          sunrise: '06:12',
          sunset: '20:05',
        },
      });
  });

  it('GET /api/destinations/:id/context devuelve 400 si el id es inválido', async () => {
    await request(app.getHttpServer())
      .get('/api/destinations/nope/context')
      .expect(400)
      .expect({
        message:
          'id must be one of the following values: gesell, pampas, marazul',
        code: ERROR_CODES.INVALID_DESTINATION_ID,
      });
  });
});
