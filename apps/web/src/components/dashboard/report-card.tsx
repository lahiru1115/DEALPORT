"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { DashboardReport, ReportRange } from "@dealport/shared";

import { DotsVerticalIcon } from "@/components/icons/generated";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";

function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  return (
    <div className="rounded-lg bg-secondary px-3 py-2 text-center shadow-ambient-3">
      <p className="text-caption font-bold text-cyprus">{label}</p>
      <p className="text-caption text-cyprus">
        {formatCompact(typeof value === "number" ? value : 0)}
      </p>
    </div>
  );
}

const SUMMARY_FIELDS: {
  key: keyof DashboardReport["summary"];
  label: string;
  prefix?: string;
}[] = [
  { key: "customers", label: "Customers" },
  { key: "totalProducts", label: "Total Products" },
  { key: "stockProducts", label: "Stock Products" },
  { key: "outOfStock", label: "Out of Stock" },
  { key: "revenue", label: "Revenue", prefix: "$" },
];

/**
 * `GET /dashboard/report` — server-rendered for `this-week` via `initialReport`
 * so the chart paints on first load with no client fetch; only switching to
 * "Last week" triggers one.
 */
export function ReportCard({ initialReport }: { initialReport: DashboardReport }) {
  const [range, setRange] = useState<ReportRange>(initialReport.range);

  const query = useQuery({
    queryKey: ["dashboard", "report", range],
    queryFn: () => api.dashboard.report(range),
    initialData: range === initialReport.range ? initialReport : undefined,
  });

  const report = query.data ?? initialReport;

  return (
    <Card className="col-span-3 lg:col-span-2">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-title text-cyprus">Report for this week</h3>
        <div className="flex items-center gap-2">
          <div className="flex h-10 items-center gap-1 rounded-full bg-secondary p-1">
            {(["this-week", "last-week"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={cn(
                  "h-8 rounded-full px-4 text-sm transition-colors",
                  range === option
                    ? "bg-white font-bold text-cyprus"
                    : "text-grey hover:text-cyprus",
                )}
              >
                {option === "this-week" ? "This week" : "Last week"}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="More options"
            className="grid size-8 shrink-0 place-items-center rounded-md text-grey transition-colors hover:bg-accent hover:text-cyprus"
          >
            <DotsVerticalIcon className="size-5" />
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-5 border-b border-hairline pb-4">
        {SUMMARY_FIELDS.map((field, index) => (
          <div key={field.key} className={cn("pb-3", index === 0 && "border-b-2 border-primary")}>
            <p className="text-[28px] font-bold text-cyprus">
              {field.prefix}
              {formatCompact(report.summary[field.key])}
            </p>
            <p className="text-caption text-grey">{field.label}</p>
          </div>
        ))}
      </div>

      <div className={cn("h-64 transition-opacity", query.isFetching && "opacity-60")}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={report.series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="reportFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-grey)", fontSize: 14 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-grey)", fontSize: 14 }}
              tickFormatter={(value: number) => `${value / 1000}k`}
              width={40}
            />
            <Tooltip
              content={ChartTooltip}
              cursor={{ stroke: "var(--color-hairline)", strokeDasharray: 4 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill="url(#reportFill)"
              activeDot={{ r: 5, fill: "var(--color-chart-1)", stroke: "white", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
