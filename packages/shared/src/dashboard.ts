import type { IsoDateString, MoneyString } from "./product";
import type { OrderStatus, PaymentMethod } from "./enums";

export interface StatDelta {
  value: number;
  previous: number;
  deltaPct: number;
  period: "LAST_7_DAYS";
}

export interface DashboardStats {
  totalSales: StatDelta;
  totalOrders: StatDelta;
  pending: { count: number; users: number };
  canceled: { count: number; deltaPct: number };
}

export const REPORT_RANGES = ["this-week", "last-week"] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];

export type WeekdayLabel = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

export interface ReportPoint {
  day: WeekdayLabel;
  value: number;
}

export interface DashboardReport {
  range: ReportRange;
  summary: {
    customers: number;
    totalProducts: number;
    stockProducts: number;
    outOfStock: number;
    revenue: number;
  };
  series: ReportPoint[];
}

export interface Transaction {
  id: string;
  reference: string;
  customerRef: string;
  customerName: string;
  placedAt: IsoDateString;
  status: OrderStatus;
  amount: MoneyString;
  method: PaymentMethod;
}
