import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, StockStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ReportRange } from './dto/dashboard-report-query.dto';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

interface Window {
  start: Date;
  end: Date;
}

/**
 * Read-only aggregations over seeded Order/OrderItem/Product data — see
 * plans/02-API.md §6. Nothing here writes; the dashboard has no create/update path.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const { last7, prev7 } = this.trailingWindows();

    const [
      salesLast7,
      salesPrev7,
      ordersLast7,
      ordersPrev7,
      pendingCount,
      pendingCustomers,
      canceledLast7,
      canceledPrev7,
    ] = await Promise.all([
      this.sumAmount({ status: OrderStatus.PAID, placedAt: { gte: last7.start, lt: last7.end } }),
      this.sumAmount({ status: OrderStatus.PAID, placedAt: { gte: prev7.start, lt: prev7.end } }),
      this.prisma.order.count({ where: { placedAt: { gte: last7.start, lt: last7.end } } }),
      this.prisma.order.count({ where: { placedAt: { gte: prev7.start, lt: prev7.end } } }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.findMany({
        where: { status: OrderStatus.PENDING },
        select: { customerRef: true },
        distinct: ['customerRef'],
      }),
      this.prisma.order.count({
        where: { status: OrderStatus.CANCELED, placedAt: { gte: last7.start, lt: last7.end } },
      }),
      this.prisma.order.count({
        where: { status: OrderStatus.CANCELED, placedAt: { gte: prev7.start, lt: prev7.end } },
      }),
    ]);

    const totalSalesValue = Math.round(salesLast7);
    const totalSalesPrev = Math.round(salesPrev7);

    return {
      totalSales: {
        value: totalSalesValue,
        previous: totalSalesPrev,
        deltaPct: this.deltaPct(totalSalesValue, totalSalesPrev),
        period: 'LAST_7_DAYS',
      },
      totalOrders: {
        value: ordersLast7,
        previous: ordersPrev7,
        deltaPct: this.deltaPct(ordersLast7, ordersPrev7),
        period: 'LAST_7_DAYS',
      },
      pending: {
        count: pendingCount,
        users: pendingCustomers.length,
      },
      canceled: {
        count: canceledLast7,
        deltaPct: this.deltaPct(canceledLast7, canceledPrev7),
      },
    };
  }

  async report(range: ReportRange) {
    const week = this.weekWindow(range === 'last-week' ? 1 : 0);

    const [orders, distinctCustomers, totalProducts, stockProducts, outOfStock] = await Promise.all(
      [
        this.prisma.order.findMany({
          where: { placedAt: { gte: week.start, lt: week.end } },
          select: { placedAt: true, amount: true },
        }),
        this.prisma.order.findMany({
          where: { placedAt: { gte: week.start, lt: week.end } },
          select: { customerRef: true },
          distinct: ['customerRef'],
        }),
        this.prisma.product.count(),
        this.prisma.product.count({ where: { stockStatus: { not: StockStatus.OUT_OF_STOCK } } }),
        this.prisma.product.count({ where: { stockStatus: StockStatus.OUT_OF_STOCK } }),
      ],
    );

    const series = WEEKDAY_LABELS.map((day, index) => {
      const dayStart = new Date(week.start.getTime() + index * DAY_MS);
      const dayEnd = new Date(dayStart.getTime() + DAY_MS);
      const value = orders
        .filter((order) => order.placedAt >= dayStart && order.placedAt < dayEnd)
        .reduce((sum, order) => sum + Number(order.amount), 0);
      return { day, value: Math.round(value) };
    });

    const revenue = series.reduce((sum, point) => sum + point.value, 0);

    return {
      range,
      summary: {
        customers: distinctCustomers.length,
        totalProducts,
        stockProducts,
        outOfStock,
        revenue,
      },
      series,
    };
  }

  async transactions(limit: number) {
    const data = await this.prisma.order.findMany({
      orderBy: { placedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        reference: true,
        customerRef: true,
        customerName: true,
        placedAt: true,
        status: true,
        amount: true,
        method: true,
      },
    });

    return {
      // Prisma's Decimal#toString() strips trailing zeros ("45" instead of "45.00") —
      // money fields are formatted to a fixed 2dp string to match plans/02-API.md's contract.
      data: data.map((order) => ({ ...order, amount: order.amount.toFixed(2) })),
    };
  }

  private async sumAmount(where: Prisma.OrderWhereInput): Promise<number> {
    const result = await this.prisma.order.aggregate({ where, _sum: { amount: true } });
    return Number(result._sum.amount ?? 0);
  }

  private trailingWindows(): { last7: Window; prev7: Window } {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const last7End = new Date(startOfToday.getTime() + DAY_MS); // tomorrow 00:00, exclusive
    const last7Start = new Date(last7End.getTime() - 7 * DAY_MS);
    const prev7End = last7Start;
    const prev7Start = new Date(prev7End.getTime() - 7 * DAY_MS);

    return {
      last7: { start: last7Start, end: last7End },
      prev7: { start: prev7Start, end: prev7End },
    };
  }

  private weekWindow(weeksAgo: number): Window {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const dayOfWeek = startOfToday.getDay(); // 0 = Sun
    const start = new Date(startOfToday.getTime() - dayOfWeek * DAY_MS - weeksAgo * 7 * DAY_MS);
    const end = new Date(start.getTime() + 7 * DAY_MS);
    return { start, end };
  }

  private deltaPct(current: number, previous: number): number {
    if (previous === 0) {
      return current === 0 ? 0 : 100;
    }
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }
}
