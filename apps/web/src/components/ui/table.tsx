"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/*
  Rethemed to the kit's table: 1px hairline row dividers, no divider under the
  last row, and a soft hover lift.

  The header fill is a prop, not a default, because the kit uses two header
  treatments and the spec only documented one. `6 Categories.png` and the
  dashboard's "Best selling product" fill the header aqua-spring; the
  dashboard's "Transaction" table leaves it white with a hairline beneath.
  Baking aqua-spring in would silently make Transaction wrong.
*/

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-base", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({
  className,
  variant = "filled",
  ...props
}: React.ComponentProps<"thead"> & {
  /** `filled` = aqua-spring (Categories, Best selling) · `plain` = white with a hairline (Transaction) */
  variant?: "filled" | "plain"
}) {
  return (
    <thead
      data-slot="table-header"
      data-variant={variant}
      className={cn(
        "[&_tr]:border-0",
        variant === "filled"
          ? "bg-aqua-spring"
          : "bg-transparent [&_tr]:border-b [&_tr]:border-border",
        className
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "[&_tr:last-child]:border-0 [&_tr]:hover:bg-canvas [&_tr]:hover:shadow-ambient-1",
        className
      )}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-canvas font-bold [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border transition-colors data-[state=selected]:bg-aqua-spring",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        // Case is left to the call site: Categories renders "Created Date",
        // Best selling renders "TOTAL ORDER".
        "h-14 px-4 text-left align-middle text-base font-normal whitespace-nowrap text-cyprus has-[[role=checkbox]]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-3.5 align-middle whitespace-nowrap has-[[role=checkbox]]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-caption text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
