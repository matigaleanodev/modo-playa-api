import { applyDecorators } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';

export function ApiIdParam(name: string, description: string) {
  return applyDecorators(
    ApiParam({
      name,
      type: String,
      description,
    }),
  );
}
