"use client";

import { usePathname } from "next/navigation";
import type { AuthUser } from "@dealport/shared";

import { Avatar } from "@/components/ui/avatar";
import { BellNotificationIcon, SearchIcon, SunLightModeIcon } from "@/components/icons/generated";

import { NAV_TITLES } from "./nav-config";

/**
 * The theme toggle is drawn from the artwork but never wired up — the app is
 * light-only (globals.css: "brief §5 puts theme polish out of scope"). It
 * stays visible for fidelity, thumb pinned to the light-mode side.
 */
function ThemeToggle() {
  return (
    <div
      aria-hidden="true"
      className="flex h-8 w-14 shrink-0 items-center rounded-full bg-secondary p-1"
    >
      <div className="grid size-6 place-items-center rounded-full bg-white shadow-ambient-1">
        <SunLightModeIcon className="size-4 text-cyprus" />
      </div>
    </div>
  );
}

export function Topbar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const title = NAV_TITLES[pathname] ?? "Dashboard";

  return (
    <header className="flex h-topbar shrink-0 items-center justify-between bg-white pl-5 pr-11">
      <h1 className="text-section text-cyprus">{title}</h1>

      <div className="flex items-center gap-6">
        <div className="relative w-101.75">
          <input
            type="search"
            placeholder="Search data, users, or reports"
            className="h-12 w-full rounded-lg border border-field-border bg-input px-4 pr-11 text-base text-cyprus placeholder:text-grey focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none"
          />
          <SearchIcon className="absolute top-1/2 right-4 size-5 -translate-y-1/2 text-grey" />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative grid size-10 shrink-0 place-items-center rounded-full text-grey transition-colors hover:bg-accent hover:text-cyprus"
        >
          <BellNotificationIcon className="size-5" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-error" />
        </button>

        <ThemeToggle />

        <Avatar src={user.avatarUrl} name={user.name} size={40} />
      </div>
    </header>
  );
}
