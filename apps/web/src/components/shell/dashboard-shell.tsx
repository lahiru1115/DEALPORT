"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { AuthUser } from "@dealport/shared";

import { cn } from "@/lib/utils";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const STORAGE_KEY = "dealport:sidebar-collapsed";

/**
 * Owns the collapse state and shares it between `Sidebar` (which renders
 * icon-only when collapsed) and this wrapper's own content offset — they're
 * siblings, not parent/child, so the state has to live above both. Kept as
 * plain lifted state rather than a context: there are exactly two consumers.
 */
export function DashboardShell({ user, children }: { user: AuthUser; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  // Read after mount, not as the initial state, so the server-rendered HTML
  // and the first client render agree (avoids a hydration mismatch) — this
  // one extra render is the cost of persisting the preference at all.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <Sidebar user={user} collapsed={collapsed} onToggleCollapsed={toggle} />
      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[padding-left] duration-200",
          collapsed ? "pl-sidebar-collapsed" : "pl-sidebar",
        )}
      >
        <Topbar user={user} />
        {/* Content insets measured off `2 Dashboard.png` / `6 Categories.png` / `8 Add Product.png` — asymmetric on purpose (20 left, 44 right). */}
        <main className="flex-1 py-5 pr-11 pl-5">{children}</main>
      </div>
    </div>
  );
}
