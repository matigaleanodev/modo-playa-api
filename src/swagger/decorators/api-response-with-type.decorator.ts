import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';

function buildSchema(model: Type<unknown>, example?: unknown) {
  if (example === undefined) {
    return { $ref: getSchemaPath(model) };
  }

  return {
    allOf: [{ $ref: getSchemaPath(model) }],
    example,
  };
}

export function ApiOkResponseWithType(
  model: Type<unknown>,
  options: {
    description: string;
    example?: unknown;
  },
) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description: options.description,
      schema: buildSchema(model, options.example),
    }),
  );
}

export function ApiCreatedResponseWithType(
  model: Type<unknown>,
  options: {
    description: string;
    example?: unknown;
  },
) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiCreatedResponse({
      description: options.description,
      schema: buildSchema(model, options.example),
    }),
  );
}
