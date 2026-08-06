import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Shown while `serverApi.products.get(id)` resolves on the edit page. */
export default function EditProductLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-3">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-40" />
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[612fr_486fr]">
        <div className="space-y-6">
          <Card className="h-72">
            <Skeleton className="h-full w-full" />
          </Card>
          <Card className="h-80">
            <Skeleton className="h-full w-full" />
          </Card>
          <Card className="h-56">
            <Skeleton className="h-full w-full" />
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="h-96">
            <Skeleton className="h-full w-full" />
          </Card>
          <Card className="h-72">
            <Skeleton className="h-full w-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}
