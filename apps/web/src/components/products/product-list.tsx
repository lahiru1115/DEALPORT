"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  PaginatedResponse,
  Product,
  ProductQuery,
  ProductSortField,
  ProductStatus,
  SortOrder,
  StockStatus,
} from "@dealport/shared";

import { CirclePlusOutlineIcon } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

import { DeleteProductDialog } from "./delete-product-dialog";
import { ProductFilters, type StatusTab } from "./product-filters";
import { ProductTable } from "./product-table";

const PAGE_SIZE = 10;

function updateSearchParams(
  current: URLSearchParams,
  patch: Record<string, string | undefined>,
) {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === "") next.delete(key);
    else next.set(key, value);
  }
  return next.toString();
}

export function ProductList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const status = searchParams.get("status") as ProductStatus | null;
  const stockStatus = searchParams.get("stockStatus") as StockStatus | null;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const search = searchParams.get("search") ?? "";
  const sortBy = (searchParams.get("sortBy") as ProductSortField | null) ?? "createdAt";
  const sortOrder = (searchParams.get("sortOrder") as SortOrder | null) ?? "desc";

  const activeTab: StatusTab =
    status === "PUBLISHED"
      ? "PUBLISHED"
      : status === "DRAFT"
        ? "DRAFT"
        : stockStatus === "OUT_OF_STOCK"
          ? "OUT_OF_STOCK"
          : "all";

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  function navigate(patch: Record<string, string | undefined>) {
    router.push(`${pathname}?${updateSearchParams(searchParams, patch)}`, { scroll: false });
  }

  useEffect(() => {
    if (debouncedSearch === search) return;
    navigate({ search: debouncedSearch || undefined, page: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function handleTabChange(tab: StatusTab) {
    navigate({
      status: tab === "PUBLISHED" || tab === "DRAFT" ? tab : undefined,
      stockStatus: tab === "OUT_OF_STOCK" ? "OUT_OF_STOCK" : undefined,
      page: undefined,
    });
  }

  function handleCategoryChange(nextCategoryId: string | undefined) {
    navigate({ categoryId: nextCategoryId, page: undefined });
  }

  function handleSortChange(value: `${ProductSortField}:${SortOrder}`) {
    const [nextSortBy, nextSortOrder] = value.split(":") as [ProductSortField, SortOrder];
    navigate({ sortBy: nextSortBy, sortOrder: nextSortOrder });
  }

  function handleClearFilters() {
    setSearchInput("");
    router.push(pathname, { scroll: false });
  }

  const listQuery: ProductQuery = {
    search: search || undefined,
    status: status ?? undefined,
    stockStatus: stockStatus ?? undefined,
    categoryId,
    sortBy,
    sortOrder,
    page,
    limit: PAGE_SIZE,
  };

  const productsQuery = useQuery({
    queryKey: ["products", listQuery],
    queryFn: ({ signal }) => api.products.list(listQuery, { signal }),
    placeholderData: keepPreviousData,
  });

  const allCountQuery = useQuery({
    queryKey: ["products", "count", "all"],
    queryFn: () => api.products.list({ limit: 1 }),
  });
  const publishedCountQuery = useQuery({
    queryKey: ["products", "count", "published"],
    queryFn: () => api.products.list({ status: "PUBLISHED", limit: 1 }),
  });
  const draftCountQuery = useQuery({
    queryKey: ["products", "count", "draft"],
    queryFn: () => api.products.list({ status: "DRAFT", limit: 1 }),
  });
  const outOfStockCountQuery = useQuery({
    queryKey: ["products", "count", "outOfStock"],
    queryFn: () => api.products.list({ stockStatus: "OUT_OF_STOCK", limit: 1 }),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.products.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["products", listQuery] });
      const previous = queryClient.getQueryData<PaginatedResponse<Product>>([
        "products",
        listQuery,
      ]);
      queryClient.setQueryData<PaginatedResponse<Product>>(["products", listQuery], (old) =>
        old
          ? {
              data: old.data.filter((product) => product.id !== id),
              meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
            }
          : old,
      );
      return { previous };
    },
    onError: (error, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["products", listQuery], context.previous);
      }
      const message = isApiError(error) ? error.message : "Failed to delete product.";
      toast.error(message, {
        action: { label: "Retry", onClick: () => deleteMutation.mutate(id) },
      });
    },
    onSuccess: () => {
      toast.success("Product deleted");
      setProductToDelete(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const products = productsQuery.data?.data ?? [];
  const meta = productsQuery.data?.meta;
  const hasFilters = Boolean(search || categoryId || activeTab !== "all");
  const isGenuinelyEmpty =
    !productsQuery.isLoading && products.length === 0 && !hasFilters && meta?.total === 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-section text-cyprus">Product List</h2>
        <Button asChild>
          <Link href="/products/new">
            <CirclePlusOutlineIcon className="size-5" />
            Add Product
          </Link>
        </Button>
      </div>

      <Card className="space-y-5 p-6">
        <ProductFilters
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={{
            all: allCountQuery.data?.meta.total,
            published: publishedCountQuery.data?.meta.total,
            draft: draftCountQuery.data?.meta.total,
            outOfStock: outOfStockCountQuery.data?.meta.total,
          }}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          categoryId={categoryId}
          onCategoryChange={handleCategoryChange}
          categories={categoriesQuery.data?.data ?? []}
          sortValue={`${sortBy}:${sortOrder}`}
          onSortChange={handleSortChange}
        />

        {productsQuery.isError ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-cyprus">Couldn&apos;t load products.</p>
            <Button variant="outline" onClick={() => productsQuery.refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <ProductTable
            products={products}
            isLoading={productsQuery.isLoading}
            onDelete={setProductToDelete}
            emptyState={
              isGenuinelyEmpty ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-cyprus">No products yet.</p>
                  <Button asChild size="sm">
                    <Link href="/products/new">Add your first product</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-cyprus">No products match your search.</p>
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    Clear filters
                  </Button>
                </div>
              )
            }
          />
        )}

        {meta && meta.totalPages > 1 ? (
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(nextPage) => navigate({ page: String(nextPage) })}
          />
        ) : null}
      </Card>

      <DeleteProductDialog
        product={productToDelete}
        pending={deleteMutation.isPending}
        onOpenChange={(open) => !open && setProductToDelete(null)}
        onConfirm={() => productToDelete && deleteMutation.mutate(productToDelete.id)}
      />
    </div>
  );
}
