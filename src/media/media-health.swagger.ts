import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiOkResponseWithType } from '../swagger/decorators/api-response-with-type.decorator';
import { HealthCheckResponseDto } from '../swagger/dto/health-check-response.dto';

export function ApiMediaHealthController() {
  return applyDecorators(
    ApiTags('Admin - Media'),
    ApiBearerAuth('access-token'),
  );
}

export function ApiMediaHealthDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Health check de Cloudflare R2 (temporal)',
      description:
        'Valida conectividad con R2 y acceso al bucket configurado mediante HeadBucket.',
    }),
    ApiOkResponseWithType(HealthCheckResponseDto, {
      description: 'Conectividad con media validada correctamente',
    }),
  );
}
