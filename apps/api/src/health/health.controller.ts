import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { HealthService } from './health.service';

/**
 * Render's health probe. Responds with a fixed shape on both success and
 * failure — bypassing the global exception filter via @Res() is deliberate,
 * since a probe response is not the same contract as an API error (plans/02-API.md §7).
 */
@ApiExcludeController()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  async check(@Res() res: Response) {
    const result = await this.healthService.check();
    const httpStatus = result.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    res.status(httpStatus).json(result);
  }
}
