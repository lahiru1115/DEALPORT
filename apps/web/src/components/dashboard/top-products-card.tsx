"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { WidgetProduct } from "@dealport/shared";

import { ImageOutlineIcon, SearchIcon } from "@/components/icons/generated";
import { Card } from "@/components/ui/card";

/** `GET /products/top` — the brief's explicit "must load from the products API" widget. */
export function TopProductsCard({ products }: { products: WidgetProduct[] }) {
  const [search, setSearch] = useState("");
  const filtered = search.trim()
    ? products.filter((product) =>
        product.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : products;

  return (
    <Card className="col-span-3 flex flex-col lg:col-span-1">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-title text-cyprus">Top Products</h3>
        <Link href="/products" className="text-caption font-bold text-indigo hover:underline">
          All product
        </Link>
      </div>

      <div className="relative mb-4">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search"
          className="h-11 w-full rounded-lg bg-input pr-10 pl-4 text-base text-cyprus placeholder:text-grey focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none"
        />
        <SearchIcon className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-grey" />
      </div>

      <div className="flex-1 divide-y divide-hairline">
        {filtered.length === 0 ? (
          <p className="text-caption py-6 text-center text-grey">No products match.</p>
        ) : (
          filtered.map((product) => {
            const image = product.images[0];
            return (
              <div key={product.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-md border border-hairline bg-canvas">
                  {image ? (
                    <Image
                      src={image.url}
                      alt={product.name}
                      width={44}
                      height={44}
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageOutlineIcon className="size-5 text-grey" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base text-cyprus">{product.name}</p>
                  <p className="text-caption truncate text-grey">Item: #{product.sku}</p>
                </div>
                <p className="shrink-0 font-bold text-cyprus">${product.price}</p>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
