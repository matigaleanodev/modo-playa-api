import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { createAppValidationPipe } from '../src/common/pipes/app-validation.pipe';
import { ERROR_CODES } from '../src/common/constants/error-code';
import { setupSwagger } from '../src/swagger/openapi';

type ErrorResponseBody = {
  code?: string;
};

describe('Full app minimum smoke (e2e)', () => {
  let app: INestApplication<App>;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    process.env.MONGO_URI = mongoServer.getUri();
    process.env.SECRET_KEY = 'test-secret-key';
    process.env.BCRYPT_ROUNDS = '4';
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM_EMAIL = 'no-reply@example.com';
    process.env.R2_ENDPOINT =
      'https://example-account.r2.cloudflarestorage.com';
    process.env.R2_BUCKET = 'modo-playa-media';
    process.env.R2_ACCESS_KEY_ID = 'test-access-key';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret-access-key';
    process.env.R2_REGION = 'auto';
    process.env.MEDIA_PUBLIC_BASE_URL = 'https://media.example.com';
    process.env.IMAGE_ALLOWED_MIME = 'image/jpeg,image/png,image/webp';
    process.env.PENDING_UPLOAD_TTL_SECONDS = '1800';
    process.env.LODGING_IMAGE_MAX_BYTES = '10485760';
    process.env.LODGING_IMAGE_MAX_WIDTH = '2560';
    process.env.LODGING_IMAGE_MAX_HEIGHT = '2560';
    process.env.USER_PROFILE_IMAGE_MAX_BYTES = '5242880';
    process.env.USER_PROFILE_IMAGE_MAX_WIDTH = '1024';
    process.env.USER_PROFILE_IMAGE_MAX_HEIGHT = '1024';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(createAppValidationPipe());
    setupSwagger(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  it('expone health, docs y contrato openapi con el bootstrap real', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });

    await request(app.getHttpServer())
      .get('/docs')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Swagger UI');
      });

    await request(app.getHttpServer())
      .get('/openapi.json')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('"openapi"');
        expect(response.text).toContain('"/api/auth/login"');
        expect(response.text).toContain('"/api/destinations"');
        expect(response.text).toContain('"/api/lodgings"');
      });
  });

  it('mantiene operativos los endpoints publicos principales sobre AppModule real', async () => {
    await request(app.getHttpServer())
      .get('/api/destinations')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual([
          { id: 'gesell', name: 'Villa Gesell' },
          { id: 'pampas', name: 'Mar de las Pampas' },
          { id: 'marazul', name: 'Mar Azul' },
        ]);
      });

    await request(app.getHttpServer()).get('/api/lodgings').expect(200).expect({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    });
  });

  it('aplica validacion global y guards administrativos con el bootstrap real', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({})
      .expect(400)
      .expect((response) => {
        const body = response.body as ErrorResponseBody;

        expect(body.code).toBe(ERROR_CODES.REQUEST_VALIDATION_ERROR);
      });

    await request(app.getHttpServer()).get('/api/admin/contacts').expect(401);

    await request(app.getHttpServer())
      .get('/api/admin/dashboard/summary')
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/admin/media/health')
      .expect(401);
  });
});
