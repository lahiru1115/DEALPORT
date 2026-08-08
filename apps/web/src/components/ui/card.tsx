import * as React from "react";

import { cn } from "@/lib/utils";

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
