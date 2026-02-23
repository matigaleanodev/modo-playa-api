import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '@auth/guard/auth.guard';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryResponseDto } from './dto/dashboard-summary-response.dto';
import { DASHBOARD_SUMMARY_RESPONSE_EXAMPLE } from './dashboard.swagger';

@ApiTags('Admin - Dashboard')
@ApiBearerAuth('access-token')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({
    summary: 'Resumen consolidado del dashboard admin',
    description:
      'Devuelve métricas, distribuciones, alertas y actividad reciente del owner autenticado. SUPERADMIN puede obtener resumen global.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen consolidado del panel de administración',
    schema: { example: DASHBOARD_SUMMARY_RESPONSE_EXAMPLE },
  })
  @Get('summary')
  getSummary(
    @Req() req: Request & { user: RequestUser },
  ): Promise<DashboardSummaryResponseDto> {
    return this.dashboardService.getSummary(req.user.ownerId, req.user.role);
  }
}
