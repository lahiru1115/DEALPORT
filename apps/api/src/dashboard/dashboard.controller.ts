import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardReportQueryDto } from './dto/dashboard-report-query.dto';
import { TransactionsQueryDto } from './dto/transactions-query.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  stats() {
    return this.dashboardService.stats();
  }

  @Get('report')
  report(@Query() query: DashboardReportQueryDto) {
    return this.dashboardService.report(query.range);
  }

  @Get('transactions')
  transactions(@Query() query: TransactionsQueryDto) {
    return this.dashboardService.transactions(query.limit);
  }
}
