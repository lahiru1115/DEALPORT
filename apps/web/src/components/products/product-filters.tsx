"use client";

import { FilterIcon } from "lucide-react";
import type { Category, ProductSortField, SortOrder } from "@dealport/shared";

import { ArrowUpDownOutlineIcon, SearchIcon } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type StatusTab = "all" | "PUBLISHED" | "DRAFT" | "OUT_OF_STOCK";

const SORT_OPTIONS: { value: `${ProductSortField}:${SortOrder}`; label: string }[] = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "price:asc", label: "Price: low to high" },
  { value: "price:desc", label: "Price: high to low" },
  { value: "name:asc", label: "Name: A–Z" },
  { value: "totalOrders:desc", label: "Best selling" },
];

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-8 items-center rounded-full px-4 text-sm transition-colors",
        active ? "bg-white font-bold text-cyprus" : "text-grey hover:text-cyprus",
      )}
    >
      {children}
    </button>
  );
}

export function ProductFilters({
  activeTab,
  onTabChange,
  counts,
  searchInput,
  onSearchInputChange,
  categoryId,
  onCategoryChange,
  categories,
  sortValue,
  onSortChange,
}: {
  activeTab: StatusTab;
  onTabChange: (tab: StatusTab) => void;
  counts: { all?: number; published?: number; draft?: number; outOfStock?: number };
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  categoryId: string | undefined;
  onCategoryChange: (categoryId: string | undefined) => void;
  categories: Category[];
  sortValue: `${ProductSortField}:${SortOrder}`;
  onSortChange: (value: `${ProductSortField}:${SortOrder}`) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex h-10 items-center gap-1 rounded-full bg-secondary px-1">
        <TabButton active={activeTab === "all"} onClick={() => onTabChange("all")}>
          All Product{counts.all !== undefined ? ` (${counts.all})` : ""}
        </TabButton>
        <TabButton
          active={activeTab === "PUBLISHED"}
          onClick={() => onTabChange("PUBLISHED")}
        >
          Published{counts.published !== undefined ? ` (${counts.published})` : ""}
        </TabButton>
        <TabButton active={activeTab === "DRAFT"} onClick={() => onTabChange("DRAFT")}>
          Draft{counts.draft !== undefined ? ` (${counts.draft})` : ""}
        </TabButton>
        <TabButton
          active={activeTab === "OUT_OF_STOCK"}
          onClick={() => onTabChange("OUT_OF_STOCK")}
        >
          Out of Stock{counts.outOfStock !== undefined ? ` (${counts.outOfStock})` : ""}
        </TabButton>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="Search your product"
            className="h-12 w-full rounded-lg border border-field-border bg-input pr-11 pl-4 text-base text-cyprus placeholder:text-grey focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none"
          />
          <SearchIcon className="absolute top-1/2 right-4 size-5 -translate-y-1/2 text-grey" />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Filter by category"
              className={categoryId ? "border-primary text-primary" : undefined}
            >
              <FilterIcon className="size-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <p className="text-caption font-bold text-cyprus">Category</p>
            <Select
              value={categoryId ?? "all"}
              onValueChange={(value) =>
                onCategoryChange(value === "all" || value == null ? undefined : value)
              }
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} ({category.productCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Sort products">
              <ArrowUpDownOutlineIcon className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuRadioGroup
              value={sortValue}
              onValueChange={(value) => onSortChange(value as typeof sortValue)}
            >
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
