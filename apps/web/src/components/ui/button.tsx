import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-ambient-1 hover:bg-primary/90",
        indigo:
          "border-indigo bg-transparent text-indigo hover:bg-indigo/8 aria-expanded:bg-indigo/8",
        outline:
          "border-border bg-card text-foreground hover:bg-accent aria-expanded:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-surf-crest aria-expanded:bg-surf-crest",
        ghost:
          "text-foreground hover:bg-accent aria-expanded:bg-accent",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/25",
        link: "text-indigo underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 gap-2 px-5 text-base",
        sm: "h-10 gap-1.5 px-4 text-caption [&_svg:not([class*='size-'])]:size-4",
        xs: "h-8 gap-1 rounded-md px-2.5 text-caption [&_svg:not([class*='size-'])]:size-4",
        icon: "size-12",
        "icon-sm": "size-10 [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-8 rounded-md [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
