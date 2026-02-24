import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guard/auth.guard';
import { R2HealthService } from '@media/services/r2-health.service';

@ApiTags('Admin - Media')
@ApiBearerAuth('access-token')
@Controller('admin/media')
@UseGuards(JwtAuthGuard)
export class MediaHealthController {
  constructor(private readonly r2HealthService: R2HealthService) {}

  @ApiOperation({
    summary: 'Health check de Cloudflare R2 (temporal)',
    description:
      'Valida conectividad con R2 y acceso al bucket configurado mediante HeadBucket.',
  })
  @Get('health')
  testConnection(): Promise<{ ok: boolean; message: string }> {
    return this.r2HealthService.testConnection();
  }
}
