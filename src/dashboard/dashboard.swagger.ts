import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiOkResponseWithType } from '../swagger/decorators/api-response-with-type.decorator';
import { dashboardSummaryResponseExample } from '../swagger/examples/dashboard.examples';
import { DashboardSummaryResponseDto } from './dto/dashboard-summary-response.dto';

export function ApiDashboardController() {
  return applyDecorators(
    ApiTags('Admin - Dashboard'),
    ApiBearerAuth('access-token'),
  );
}

export function ApiDashboardSummaryDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Resumen consolidado del dashboard admin',
      description:
        'Devuelve metricas, distribuciones, alertas y actividad reciente del owner autenticado. SUPERADMIN puede obtener resumen global.',
    }),
    ApiOkResponseWithType(DashboardSummaryResponseDto, {
      description: 'Resumen consolidado del panel de administracion',
      example: dashboardSummaryResponseExample,
    }),
  );
}
