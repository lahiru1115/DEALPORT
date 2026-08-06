import * as React from "react";

import { cn } from "@/lib/utils";

/*
  Custom, not shadcn's Card — the kit's card is one specific object, and every
  panel on all three screens is an instance of it. Measured off the exports:
  white surface, 12px radius, 24px padding, 1px #ECEDEE hairline, ambient-3.
  (The spec said 16px radius; the artwork's corner curve fits 12.)
*/

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-xl border border-border bg-card p-6 text-card-foreground shadow-ambient-3",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The title row the design repeats on every card: heading on the left, optional
 * actions on the right. `title` is rendered as the Bold-18 "Title for Dashboard"
 * style unless a node is passed instead.
 */
function CardHeader({
  className,
  title,
  caption,
  action,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  title?: React.ReactNode;
  caption?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      data-slot="card-header"
      className={cn("mb-5 flex items-start justify-between gap-4", className)}
      {...props}
    >
      <div className="min-w-0">
        {title ? <h2 className="text-title truncate">{title}</h2> : null}
        {caption ? (
          <p className="text-caption mt-1 text-muted-foreground">{caption}</p>
        ) : null}
        {children}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

/**
 * Cards that hold a full-bleed table need the table to reach the card edge while
 * the header keeps its 24px inset. This cancels the padding for that child only.
 */
function CardBleed({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-bleed"
      className={cn("-mx-6 -mb-6 overflow-hidden rounded-b-xl", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardBleed };
