import { IsIn, IsOptional } from 'class-validator';

export type ReportRange = 'this-week' | 'last-week';

export class DashboardReportQueryDto {
  @IsOptional()
  @IsIn(['this-week', 'last-week'])
  range: ReportRange = 'this-week';
}
