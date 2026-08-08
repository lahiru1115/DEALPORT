import { Suspense } from "react";
import type { Metadata } from "next";

import { ProductList } from "@/components/products/product-list";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Products",
};

function ProductListFallback() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 w-36" />
      </div>
      <Card className="space-y-5 p-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-96 w-full" />
      </Card>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductListFallback />}>
      <ProductList />
    </Suspense>
  );
}
