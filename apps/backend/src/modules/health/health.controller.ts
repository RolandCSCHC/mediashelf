import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HealthResponse } from '@mediashelf/shared-types';
import { HealthService } from './health.service';
import { HealthResponseSchema } from '../../swagger/api-schemas';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'API and database health check' })
  @ApiOkResponse({ type: HealthResponseSchema })
  check(): Promise<HealthResponse> {
    return this.healthService.check();
  }
}
