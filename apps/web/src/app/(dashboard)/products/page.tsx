import { Suspense } from "react";
import type { Metadata } from "next";

import { ProductList } from "@/components/products/product-list";

export const metadata: Metadata = {
  title: "Products",
};

export default function ProductsPage() {
  // `useSearchParams` in ProductList opts the subtree into client rendering,
  // so the boundary is required for the page to prerender.
  return (
    <Suspense fallback={null}>
      <ProductList />
    </Suspense>
  );
}
