import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/*
  Plain `twMerge` doesn't know about this project's custom `@utility`
  text-size classes (`text-title`/`text-section`/`text-caption`, defined in
  globals.css) — it falls back to treating any unrecognized `text-*` class as
  a `text-color` utility, which makes it conflict with (and silently drop)
  a *real* color class like `text-error` in the same `cn(...)` call. That
  bug is exactly what made `Delta`'s `text-caption` disappear whenever it was
  combined with `text-success`/`text-error`, inheriting a much larger
  font-size from whatever ancestor it was nested in instead. Registering
  these three as their own `font-size` group fixes it at the source instead
  of working around it at every call site.
*/
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": ["text-title", "text-section", "text-caption"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
