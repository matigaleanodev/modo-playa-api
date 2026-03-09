import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { buildSwaggerConfig } from './swagger.config';

export function createOpenApiDocument(app: INestApplication) {
  return SwaggerModule.createDocument(app, buildSwaggerConfig());
}

export function setupSwagger(app: INestApplication) {
  const document = createOpenApiDocument(app);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    jsonDocumentUrl: 'openapi.json',
    useGlobalPrefix: false,
  });

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/openapi.json', (_request: Request, response: Response) => {
    response.type('application/json');
    response.send(document);
  });

  return document;
}
