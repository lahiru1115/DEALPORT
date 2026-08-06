import type { IsoDateString, MoneyString } from "./product";
import type { OrderStatus, PaymentMethod } from "./enums";

/**
 * Read-only aggregations over the seeded Order/OrderItem/Product data — see
 * plans/02-API.md §6. Nothing here has a write path.
 */

/** `GET /dashboard/stats` — the three cards along the top of the dashboard. */
export interface StatDelta {
  value: number;
  previous: number;
  /** Trailing 7 days vs the 7 before. Computed, not stored. */
  deltaPct: number;
  period: "LAST_7_DAYS";
}

export interface DashboardStats {
  totalSales: StatDelta;
  totalOrders: StatDelta;
  /** The third card is split in two by a vertical rule. */
  pending: { count: number; users: number };
  canceled: { count: number; deltaPct: number };
}

/** `GET /dashboard/report?range=` */
export const REPORT_RANGES = ["this-week", "last-week"] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];

export type WeekdayLabel = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

export interface ReportPoint {
  day: WeekdayLabel;
  value: number;
}

export interface DashboardReport {
  range: ReportRange;
  /**
   * `totalProducts` / `stockProducts` / `outOfStock` are live counts against the
   * Product table, so publishing a product on the Add Product screen moves
   * these figures.
   */
  summary: {
    customers: number;
    totalProducts: number;
    stockProducts: number;
    outOfStock: number;
    revenue: number;
  };
  /** Always seven points, Sun → Sat, in order. Drives the area chart. */
  series: ReportPoint[];
}

/** `GET /dashboard/transactions?limit=` */
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
