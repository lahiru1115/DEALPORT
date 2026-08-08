"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { AuthUser } from "@dealport/shared";

import { cn } from "@/lib/utils";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const STORAGE_KEY = "dealport:sidebar-collapsed";

export function DashboardShell({ user, children }: { user: AuthUser; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

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
        <main className="flex-1 py-5 pr-11 pl-5">{children}</main>
      </div>
    </div>
  );
}
