import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const statusPillVariants = cva(
  "text-caption inline-flex items-center gap-2 rounded-full px-3 py-1 font-bold whitespace-nowrap",
  {
    variants: {
      tone: {
        success: "bg-success/10 text-success",
        pending: "bg-pending/15 text-[#8a7a00]",
        error: "bg-error/10 text-error",
        neutral: "bg-grey/10 text-grey",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

const dotVariants = cva("size-1.5 shrink-0 rounded-full", {
  variants: {
    tone: {
      success: "bg-success",
      pending: "bg-pending",
      error: "bg-error",
      neutral: "bg-grey",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});

function StatusPill({
  className,
  tone,
  children,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof statusPillVariants>) {
  return (
    <span
      data-slot="status-pill"
      className={cn(statusPillVariants({ tone }), className)}
      {...props}
    >
      <span className={cn(dotVariants({ tone }))} aria-hidden="true" />
      {children}
    </span>
  );
}

export { StatusPill, statusPillVariants };
