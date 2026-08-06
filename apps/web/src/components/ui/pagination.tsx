import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * `1 2 3 4 5 … 24` — measured off `3 Order Management.png`'s pagination
 * footer (Categories and Product List share the same pattern). Always keeps
 * the first and last page visible, with a single ellipsis collapsing the gap.
 */
function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, 2, total, total - 1, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const page of sorted) {
    if (prev && page - prev > 1) out.push("ellipsis");
    out.push(page);
    prev = page;
  }
  return out;
}

function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-between", className)}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-hairline bg-white px-4 text-base text-cyprus transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
      >
        <ArrowLeftIcon className="size-4" />
        Previous
      </button>

      <div className="flex items-center gap-2">
        {pageWindow(page, totalPages).map((entry, index) =>
          entry === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-1 text-grey">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              aria-current={entry === page ? "page" : undefined}
              onClick={() => onPageChange(entry)}
              className={cn(
                "grid size-10 place-items-center rounded-lg border text-base transition-colors",
                entry === page
                  ? "border-transparent bg-surf-crest font-bold text-cyprus"
                  : "border-hairline bg-white text-cyprus hover:bg-accent",
              )}
            >
              {entry}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-hairline bg-white px-4 text-base text-cyprus transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
      >
        Next
        <ArrowRightIcon className="size-4" />
      </button>
    </nav>
  );
}

export { Pagination };
