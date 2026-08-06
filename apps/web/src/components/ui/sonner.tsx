"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

/*
  shadcn ships this reading the active theme from `next-themes`. DEALPORT has no
  dark mode (brief §5), so the theme is pinned to light and the dependency is
  dropped rather than carried for a toggle that never fires.
*/
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-right"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-success" />
        ),
        info: (
          <InfoIcon className="size-4 text-indigo" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-pending" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-error" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast shadow-ambient-6",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
