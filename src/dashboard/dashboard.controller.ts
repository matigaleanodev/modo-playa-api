import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '@auth/guard/auth.guard';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryResponseDto } from './dto/dashboard-summary-response.dto';
import {
  ApiDashboardController,
  ApiDashboardSummaryDoc,
} from './dashboard.swagger';

@ApiDashboardController()
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiDashboardSummaryDoc()
  @Get('summary')
  getSummary(
    @Req() req: Request & { user: RequestUser },
  ): Promise<DashboardSummaryResponseDto> {
    return this.dashboardService.getSummary(req.user.ownerId, req.user.role);
  }
}
