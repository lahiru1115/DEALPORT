import Image from "next/image";
import Link from "next/link";
import type { Product } from "@dealport/shared";

import { EditIcon, ImageOutlineIcon, TrashIcon } from "@/components/icons/generated";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COLUMN_COUNT = 7;

function StockCell({ product }: { product: Product }) {
  if (product.unlimitedStock) {
    return <span className="text-cyprus">Unlimited</span>;
  }
  const quantity = product.stockQuantity ?? 0;
  if (product.stockStatus === "OUT_OF_STOCK") {
    return <span className="font-bold text-error">{quantity}</span>;
  }
  if (product.stockStatus === "LOW_STOCK") {
    return <span className="font-bold text-[#8a7a00]">{quantity}</span>;
  }
  return <span className="text-cyprus">{quantity}</span>;
}

function PriceCell({ product }: { product: Product }) {
  if (product.discountedPrice) {
    return (
      <div className="flex flex-col">
        <span className="font-bold text-cyprus">${product.discountedPrice}</span>
        <span className="text-caption text-grey line-through">${product.price}</span>
      </div>
    );
  }
  return <span className="text-cyprus">${product.price}</span>;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell colSpan={COLUMN_COUNT}>
            <Skeleton className="h-11 w-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function ProductTable({
  products,
  isLoading,
  emptyState,
  onDelete,
}: {
  products: Product[];
  isLoading: boolean;
  emptyState?: React.ReactNode;
  onDelete: (product: Product) => void;
}) {
  return (
    <Table>
      <TableHeader variant="filled">
        <TableRow>
          <TableHead>No.</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <SkeletonRows />
        ) : products.length === 0 ? (
          <TableRow>
            <TableCell colSpan={COLUMN_COUNT} className="py-12 text-center">
              {emptyState}
            </TableCell>
          </TableRow>
        ) : (
          products.map((product, index) => {
            const image = product.images[0];
            return (
              <TableRow key={product.id}>
                <TableCell className="text-grey">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
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
                    <div className="min-w-0">
                      <p className="truncate text-cyprus">{product.name}</p>
                      <p className="truncate text-caption text-grey">{product.sku}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-grey">{product.category?.name ?? "—"}</TableCell>
                <TableCell>
                  <PriceCell product={product} />
                </TableCell>
                <TableCell>
                  <StockCell product={product} />
                </TableCell>
                <TableCell>
                  <StatusPill tone={product.status === "PUBLISHED" ? "success" : "neutral"}>
                    {product.status === "PUBLISHED" ? "Published" : "Draft"}
                  </StatusPill>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/products/${product.id}/edit`}
                      aria-label={`Edit ${product.name}`}
                      className="grid size-8 place-items-center rounded-md text-grey transition-colors hover:bg-accent hover:text-cyprus"
                    >
                      <EditIcon className="size-4" />
                    </Link>
                    <button
                      type="button"
                      aria-label={`Delete ${product.name}`}
                      onClick={() => onDelete(product)}
                      className="grid size-8 place-items-center rounded-md text-grey transition-colors hover:bg-destructive/10 hover:text-error"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
