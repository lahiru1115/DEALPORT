import * as React from "react"

import { cn } from "@/lib/utils"

/*
  Rethemed per plans/03-DESIGN-SYSTEM.md §4: fields in this kit are *filled*,
  not outlined. `bg-input` and `border-input` resolve to the same canvas value
  (see globals.css), so the field is a flat surface at rest and only picks up
  the ocean-green ring on focus. Height 44 and 16px text match the Body scale.
*/
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // 48px tall, radius 10 — measured off the Product Name field.
        "h-12 w-full min-w-0 rounded-lg border border-input bg-input px-4 py-2 text-base text-foreground transition-colors outline-none",
        "file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-bold file:text-foreground",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
