import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthStatus {
  status: 'ok' | 'error';
  database: 'up' | 'down';
  uptime: number;
  timestamp: string;
}

@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    const uptime = (Date.now() - this.startedAt) / 1000;
    const timestamp = new Date().toISOString();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up', uptime, timestamp };
    } catch {
      return { status: 'error', database: 'down', uptime, timestamp };
    }
  }
}
