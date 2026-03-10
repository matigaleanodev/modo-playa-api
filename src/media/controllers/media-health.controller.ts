import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guard/auth.guard';
import { R2HealthService } from '@media/services/r2-health.service';
import {
  ApiMediaHealthController,
  ApiMediaHealthDoc,
} from '../media-health.swagger';
import { HealthCheckResponseDto } from '../../swagger/dto/health-check-response.dto';

@ApiMediaHealthController()
@Controller('admin/media')
@UseGuards(JwtAuthGuard)
export class MediaHealthController {
  constructor(private readonly r2HealthService: R2HealthService) {}

  @ApiMediaHealthDoc()
  @Get('health')
  testConnection(): Promise<HealthCheckResponseDto> {
    return this.r2HealthService.testConnection();
  }
}
