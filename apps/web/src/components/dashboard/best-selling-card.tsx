import Image from "next/image";
import { FilterIcon } from "lucide-react";
import type { WidgetProduct } from "@dealport/shared";

import { ImageOutlineIcon } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function StockWord({ inStock }: { inStock: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-bold",
        inStock ? "text-success" : "text-error",
      )}
    >
      <span className={cn("size-1.5 rounded-full", inStock ? "bg-success" : "bg-error")} />
      {inStock ? "Stock" : "Stock out"}
    </span>
  );
}

export function BestSellingCard({ products }: { products: WidgetProduct[] }) {
  return (
    <Card className="col-span-3 flex flex-col lg:col-span-2">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-title text-cyprus">Best selling product</h3>
        <Button size="sm" className="rounded-full">
          Filter
          <FilterIcon className="size-4" />
        </Button>
      </div>

      <Table>
        <TableHeader variant="filled">
          <TableRow>
            <TableHead className="uppercase">Product</TableHead>
            <TableHead className="uppercase">Total Order</TableHead>
            <TableHead className="uppercase">Status</TableHead>
            <TableHead className="text-right uppercase">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-grey">
                No sales yet.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => {
              const image = product.images[0];
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border border-hairline bg-canvas">
                        {image ? (
                          <Image
                            src={image.url}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="size-full object-cover"
                          />
                        ) : (
                          <ImageOutlineIcon className="size-4 text-grey" />
                        )}
                      </div>
                      <span className="text-cyprus">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-cyprus">{product.totalOrders}</TableCell>
                  <TableCell>
                    <StockWord inStock={product.stockStatus !== "OUT_OF_STOCK"} />
                  </TableCell>
                  <TableCell className="text-right font-bold text-cyprus">
                    ${product.price}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <div className="mt-4 flex justify-end">
        <Button variant="indigo" size="sm" className="rounded-full">
          Details
        </Button>
      </div>
    </Card>
  );
}
