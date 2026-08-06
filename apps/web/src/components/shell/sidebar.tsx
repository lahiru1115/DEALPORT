"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AuthUser } from "@dealport/shared";

import { Avatar } from "@/components/ui/avatar";
import {
  BoxPackageIcon,
  LinkExternalIcon,
  RoundLogoutIcon,
  SidebarCollapseIcon,
} from "@/components/icons/generated";
import { cn } from "@/lib/utils";

import { NAV_GROUPS, type NavItem } from "./nav-config";

/**
 * Shared row styling for both real links and inert items — measured off
 * `2 Dashboard.png`: 42px tall, 8px radius, content starts 11px inside the
 * pill's own bounds (pill spans the full 232px inset; icon/label sit 11px in).
 */
const ROW_CLASS =
  "flex h-[42px] items-center gap-3 rounded-pill px-3 text-base transition-colors";

function NavRow({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const content = (
    <>
      <Icon className="size-5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </>
  );

  if (!item.href) {
    // Inert — present for fidelity, not wired to a screen (brief §5).
    return (
      <button
        type="button"
        className={cn(ROW_CLASS, "text-grey hover:bg-accent hover:text-cyprus")}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        ROW_CLASS,
        active
          ? "bg-primary font-bold text-primary-foreground"
          : "text-grey hover:bg-accent hover:text-cyprus",
      )}
    >
      {content}
    </Link>
  );
}

export function Sidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    router.push("/login");
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-sidebar flex-col border-r border-hairline bg-surface">
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <Image src="/brand/dealport-logo.svg" alt="DEALPORT" width={181} height={38} className="h-5 w-auto" />
        <button
          type="button"
          aria-label="Collapse sidebar"
          className="grid size-6 shrink-0 place-items-center text-grey transition-colors hover:text-cyprus"
        >
          <SidebarCollapseIcon className="size-4" />
        </button>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3.5 pb-2 text-xs text-grey">{group.label}</p>
            <div className="mx-3.5 space-y-1.5">
              {group.items.map((item) => (
                <NavRow key={item.label} item={item} active={pathname === item.href} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-3 px-3.5 py-4">
        <div className="flex items-center gap-3">
          <Avatar src={user.avatarUrl} name={user.name} size={44} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-cyprus">{user.name}</p>
            <p className="truncate text-xs text-grey">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="grid size-8 shrink-0 place-items-center rounded-md text-grey transition-colors hover:bg-accent hover:text-cyprus"
          >
            <RoundLogoutIcon className="size-5" />
          </button>
        </div>

        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg border border-hairline px-3 py-2.5 text-sm font-bold text-cyprus transition-colors hover:bg-accent"
        >
          <BoxPackageIcon className="size-5 shrink-0" />
          <span className="flex-1 text-left">Your Shop</span>
          <LinkExternalIcon className="size-4 shrink-0 text-grey" />
        </button>
      </div>
    </aside>
  );
}
