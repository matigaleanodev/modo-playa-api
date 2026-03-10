import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';

export function ApiPaginatedOkResponse(
  model: Type<unknown>,
  options: {
    description: string;
    example?: unknown;
  },
) {
  return applyDecorators(
    ApiExtraModels(PaginatedResponseDto, model),
    ApiOkResponse({
      description: options.description,
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(model) },
          },
          total: {
            type: 'number',
          },
          page: {
            type: 'number',
          },
          limit: {
            type: 'number',
          },
        },
        required: ['data', 'total', 'page', 'limit'],
        ...(options.example === undefined ? {} : { example: options.example }),
      },
    }),
  );
}
