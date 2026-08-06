import type { DashboardStats } from "@dealport/shared";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

import { DotsVerticalIcon } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

function Delta({ pct }: { pct: number }) {
  const positive = pct >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-caption font-bold",
        positive ? "text-success" : "text-error",
      )}
    >
      {positive ? <ArrowUpIcon className="size-3.5" /> : <ArrowDownIcon className="size-3.5" />}
      {Math.abs(pct)}%
    </span>
  );
}

/** Every kebab menu and "Details" button here is decorative — the brief scopes no drill-down page behind them. */
function CardMenuButton() {
  return (
    <button
      type="button"
      aria-label="More options"
      className="grid size-8 shrink-0 place-items-center rounded-md text-grey transition-colors hover:bg-accent hover:text-cyprus"
    >
      <DotsVerticalIcon className="size-5" />
    </button>
  );
}

function DetailsButton() {
  return (
    <Button variant="indigo" size="sm" className="rounded-full">
      Details
    </Button>
  );
}

/**
 * `GET /dashboard/stats` — measured off `2 Dashboard.png`: three equal cards,
 * the third split by a vertical rule into Pending / Canceled.
 */
export function StatCards({ stats }: { stats: DashboardStats }) {
  return (
    <>
      <Card className="col-span-3 flex flex-col sm:col-span-1">
        <div className="mb-1 flex items-start justify-between">
          <h3 className="text-title text-cyprus">Total Sales</h3>
          <CardMenuButton />
        </div>
        <p className="text-caption mb-5 text-grey">Last 7 days</p>
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-[32px] font-bold text-cyprus">
            ${formatCompact(stats.totalSales.value)}
          </span>
          <span className="text-base text-cyprus">Sales</span>
          <Delta pct={stats.totalSales.deltaPct} />
        </div>
        <p className="text-caption mb-5 text-grey">
          Previous 7 days{" "}
          <span className="font-bold text-indigo">
            (${formatCompact(stats.totalSales.previous)})
          </span>
        </p>
        <div className="mt-auto flex justify-end">
          <DetailsButton />
        </div>
      </Card>

      <Card className="col-span-3 flex flex-col sm:col-span-1">
        <div className="mb-1 flex items-start justify-between">
          <h3 className="text-title text-cyprus">Total Orders</h3>
          <CardMenuButton />
        </div>
        <p className="text-caption mb-5 text-grey">Last 7 days</p>
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-[32px] font-bold text-cyprus">
            {formatCompact(stats.totalOrders.value)}
          </span>
          <span className="text-base text-cyprus">order</span>
          <Delta pct={stats.totalOrders.deltaPct} />
        </div>
        <p className="text-caption mb-5 text-grey">
          Previous 7 days{" "}
          <span className="font-bold text-indigo">
            ({formatCompact(stats.totalOrders.previous)})
          </span>
        </p>
        <div className="mt-auto flex justify-end">
          <DetailsButton />
        </div>
      </Card>

      <Card className="col-span-3 flex flex-col sm:col-span-1">
        <div className="mb-1 flex items-start justify-between">
          <h3 className="text-title text-cyprus">Pending &amp; Canceled</h3>
          <CardMenuButton />
        </div>
        <p className="text-caption mb-5 text-grey">Last 7 days</p>
        <div className="mb-5 flex flex-1 items-start gap-6">
          <div>
            <p className="mb-2 text-base text-cyprus">Pending</p>
            <p className="text-[32px] font-bold text-cyprus">
              {stats.pending.count}{" "}
              <span className="text-base font-normal text-success">
                user {stats.pending.users}
              </span>
            </p>
          </div>
          <div className="h-14 w-px shrink-0 self-center bg-hairline" />
          <div>
            <p className="mb-2 text-base text-cyprus">Canceled</p>
            <p className="flex items-baseline gap-2 text-[32px] font-bold text-error">
              {stats.canceled.count}
              <Delta pct={stats.canceled.deltaPct} />
            </p>
          </div>
        </div>
        <div className="mt-auto flex justify-end">
          <DetailsButton />
        </div>
      </Card>
    </>
  );
}
