import { DocumentBuilder } from '@nestjs/swagger';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Modo Playa API')
    .setDescription(
      'Modo Playa API es el backend de una plataforma de catalogo de alojamientos pensada para alquileres turisticos.',
    )
    .setVersion('1.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();
}
