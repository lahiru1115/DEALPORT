"use client";

import Image from "next/image";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer } from "recharts";

import { DotsVerticalIcon } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Neither "Users in last 30 minutes" nor "Sales by Country" has a backing
 * endpoint — `plans/02-API.md` has no realtime-analytics or geo-sales route,
 * and the brief permits static data when documented (§7). Both are static
 * here, matching the artwork's own numbers.
 */
const USERS_PER_MINUTE = [
  4, 7, 3, 8, 5, 9, 4, 6, 8, 3, 7, 5, 9, 6, 4, 8, 5, 7, 9, 6, 4, 8, 6, 9,
].map((value, index) => ({ minute: index, value }));

const COUNTRY_SALES = [
  { code: "US", name: "US", flag: "/flags/usa.svg", value: "30k", deltaPct: 25.8 },
  { code: "BR", name: "Brazil", flag: "/flags/bra.svg", value: "30k", deltaPct: -15.8 },
  { code: "AU", name: "Australia", flag: "/flags/aus.svg", value: "25k", deltaPct: 35.8 },
];

export function LiveUsersCard() {
  return (
    <Card className="col-span-3 flex flex-col lg:col-span-1">
      <div className="mb-1 flex items-start justify-between">
        <h3 className="text-title text-indigo">Users in last 30 minutes</h3>
        <button
          type="button"
          aria-label="More options"
          className="grid size-8 shrink-0 place-items-center rounded-md text-grey transition-colors hover:bg-accent hover:text-cyprus"
        >
          <DotsVerticalIcon className="size-5" />
        </button>
      </div>
      <p className="mb-4 text-[32px] font-bold text-cyprus">21.5K</p>

      <p className="text-caption mb-2 text-grey">Users per minute</p>
      <div className="mb-6 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={USERS_PER_MINUTE} barCategoryGap={2}>
            <Bar dataKey="value" fill="var(--color-chart-1)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-lg">
        <Image
          src="/brand/world-map.svg"
          alt=""
          aria-hidden="true"
          fill
          className="object-cover opacity-40"
        />

        <div className="relative flex flex-col gap-4 p-1">
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-cyprus">Sales by Country</p>
            <p className="text-caption text-grey">Sales</p>
          </div>

          {COUNTRY_SALES.map((country) => {
            const positive = country.deltaPct >= 0;
            return (
              <div key={country.code} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="relative size-8 shrink-0 overflow-hidden rounded-full"
                >
                  <Image src={country.flag} alt="" fill className="object-cover" />
                </span>
                <div className="w-12 shrink-0">
                  <p className="text-base font-bold text-cyprus">{country.value}</p>
                  <p className="text-caption text-grey">{country.name}</p>
                </div>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/70">
                  <div
                    className="h-full rounded-full bg-indigo"
                    style={{ width: `${Math.min(100, Math.abs(country.deltaPct) * 2)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "flex shrink-0 items-center gap-0.5 text-caption font-bold",
                    positive ? "text-success" : "text-error",
                  )}
                >
                  {positive ? (
                    <ArrowUpIcon className="size-3.5" />
                  ) : (
                    <ArrowDownIcon className="size-3.5" />
                  )}
                  {Math.abs(country.deltaPct)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <Button variant="indigo" size="sm" className="w-full rounded-full">
          View Insight
        </Button>
      </div>
    </Card>
  );
}
