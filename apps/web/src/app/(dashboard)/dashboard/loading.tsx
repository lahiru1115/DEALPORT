import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown while `dashboard/page.tsx`'s `Promise.all([...])` is in flight —
 * mirrors the real grid (§2 of `05-MEASURED-SPEC.md`) so nothing reflows once
 * the data lands.
 */
export default function DashboardLoading() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="col-span-3 h-56 sm:col-span-1">
          <Skeleton className="h-full w-full" />
        </Card>
      ))}
      <Card className="col-span-3 h-96 lg:col-span-2">
        <Skeleton className="h-full w-full" />
      </Card>
      <Card className="col-span-3 h-96 lg:col-span-1">
        <Skeleton className="h-full w-full" />
      </Card>
      <Card className="col-span-3 h-80 lg:col-span-2">
        <Skeleton className="h-full w-full" />
      </Card>
      <Card className="col-span-3 h-80 lg:col-span-1">
        <Skeleton className="h-full w-full" />
      </Card>
      <Card className="col-span-3 h-80 lg:col-span-2">
        <Skeleton className="h-full w-full" />
      </Card>
      <Card className="col-span-3 h-80 lg:col-span-1">
        <Skeleton className="h-full w-full" />
      </Card>
    </div>
  );
}
