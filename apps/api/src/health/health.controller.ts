import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Render's health probe. Responds with a fixed shape on both success and
 * failure — bypassing the global exception filter via @Res() is deliberate,
 * since a probe response is not the same contract as an API error (plans/02-API.md §7).
 */
@ApiExcludeController()
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check(@Res() res: Response) {
    const uptime = (Date.now() - this.startedAt) / 1000;
    const timestamp = new Date().toISOString();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      res.status(HttpStatus.OK).json({ status: 'ok', database: 'up', uptime, timestamp });
    } catch {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({ status: 'error', database: 'down', uptime, timestamp });
    }
  }
}
