import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

export function ApiFormDataBody(options: {
  fileFieldName?: string;
  requiredFields?: string[];
  properties?: Record<string, Record<string, unknown>>;
}) {
  const fileFieldName = options.fileFieldName ?? 'file';

  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: [fileFieldName, ...(options.requiredFields ?? [])],
        properties: {
          [fileFieldName]: {
            type: 'string',
            format: 'binary',
          },
          ...(options.properties ?? {}),
        },
      },
    }),
  );
}
