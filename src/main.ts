import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger/openapi';
import { createAppValidationPipe } from '@common/pipes/app-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  //const corsOrigins = process.env.CORS_ORIGIN?.split(',') ?? [];

  app.enableCors({
    origin: '*',
  });

  app.useGlobalPipes(createAppValidationPipe());

  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
