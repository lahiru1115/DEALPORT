import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import type { Category } from "@dealport/shared";

import { CirclePlusIcon, ImageOutlineIcon } from "@/components/icons/generated";
import { Card } from "@/components/ui/card";

/**
 * The kit's "Product" suggestion rows (Smart Fitness Tracker, Leather Wallet…)
 * have no backing list in the API — there is no "suggested products" endpoint
 * — so they are static, matching the artwork's own items. The category rows
 * above them are real (`GET /categories`) and link into the Product List's
 * existing category filter.
 */
const SUGGESTED_PRODUCTS = [
  { name: "Smart Fitness Tracker", price: "39.99" },
  { name: "Leather Wallet", price: "19.99" },
  { name: "Electric Hair Trimmer", price: "24.99" },
];

export function AddNewProductCard({ categories }: { categories: Category[] }) {
  return (
    <Card className="col-span-3 lg:col-span-1">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-title text-cyprus">Add New Product</h3>
        <Link
          href="/products/new"
          className="flex items-center gap-1.5 text-caption font-bold text-indigo hover:underline"
        >
          <CirclePlusIcon className="size-4" />
          Add New
        </Link>
      </div>

      <p className="text-caption mb-2 text-grey">Categories</p>
      <div className="mb-3 space-y-2.5">
        {categories.slice(0, 3).map((category) => (
          <Link
            key={category.id}
            href={`/products?categoryId=${category.id}`}
            className="flex items-center gap-3 rounded-lg border border-hairline p-2 transition-colors hover:bg-accent"
          >
            <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border border-hairline bg-canvas">
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  width={40}
                  height={40}
                  className="size-full object-cover"
                />
              ) : (
                <ImageOutlineIcon className="size-4 text-grey" />
              )}
            </div>
            <span className="flex-1 truncate text-base text-cyprus">{category.name}</span>
            <ChevronRightIcon className="size-4 shrink-0 text-grey" />
          </Link>
        ))}
      </div>

      <div className="mb-5 flex justify-center">
        <Link href="/products" className="text-caption font-bold text-indigo hover:underline">
          See more
        </Link>
      </div>

      <p className="text-caption mb-2 text-grey">Product</p>
      <div className="divide-y divide-hairline">
        {SUGGESTED_PRODUCTS.map((product) => (
          <div key={product.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div className="grid size-10 shrink-0 place-items-center rounded-md border border-hairline bg-canvas">
              <ImageOutlineIcon className="size-4 text-grey" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base text-cyprus">{product.name}</p>
              <p className="text-caption font-bold text-success">${product.price}</p>
            </div>
            <Link
              href="/products/new"
              aria-label={`Add ${product.name}`}
              className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <CirclePlusIcon className="size-4" />
            </Link>
          </div>
        ))}
      </div>
    </Card>
  );
}
