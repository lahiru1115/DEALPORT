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

const ROW_CLASS =
  "flex h-[42px] w-full items-center gap-3 rounded-pill px-3 text-base transition-colors";

function NavRow({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = active && item.activeIcon ? item.activeIcon : item.icon;
  const content = (
    <>
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </>
  );
  const rowClass = cn(ROW_CLASS, collapsed && "justify-center px-0");

  if (!item.href) {
    return (
      <button
        type="button"
        title={collapsed ? item.label : undefined}
        className={cn(rowClass, "text-grey hover:bg-accent hover:text-cyprus")}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        rowClass,
        active
          ? "bg-primary font-bold text-primary-foreground"
          : "text-grey hover:bg-accent hover:text-cyprus",
      )}
    >
      {content}
    </Link>
  );
}

export function Sidebar({
  user,
  collapsed,
  onToggleCollapsed,
}: {
  user: AuthUser;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex flex-col overflow-hidden border-r border-hairline bg-surface transition-[width] duration-200",
        collapsed ? "w-sidebar-collapsed" : "w-sidebar",
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center px-5",
          collapsed ? "justify-center px-0" : "justify-between",
        )}
      >
        {!collapsed && (
          <Image
            src="/brand/dealport-logo.svg"
            alt="DEALPORT"
            width={181}
            height={38}
            className="h-7 w-auto"
          />
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="grid size-6 shrink-0 place-items-center text-grey transition-colors hover:text-cyprus"
        >
          <SidebarCollapseIcon
            className={cn(
              "size-4 transition-transform duration-300 ease-in-out",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && <p className="px-3.5 pb-2 text-xs text-grey">{group.label}</p>}
            <div className={cn("space-y-1.5", collapsed ? "mx-2" : "mx-3.5")}>
              {group.items.map((item) => (
                <NavRow
                  key={item.label}
                  item={item}
                  active={pathname === item.href}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn("shrink-0 space-y-3 py-4", collapsed ? "px-2" : "px-3.5")}>
        <div className={cn("flex items-center gap-3", collapsed && "flex-col")}>
          <Avatar src={user.avatarUrl} name={user.name} size={collapsed ? 36 : 44} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-cyprus">{user.name}</p>
              <p className="truncate text-xs text-grey">{user.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            title={collapsed ? "Log out" : undefined}
            className="grid size-8 shrink-0 place-items-center rounded-md text-grey transition-colors hover:bg-accent hover:text-cyprus"
          >
            <RoundLogoutIcon className="size-5" />
          </button>
        </div>

        {!collapsed && (
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg border border-hairline px-3 py-2.5 text-sm font-bold text-cyprus transition-colors hover:bg-accent"
          >
            <BoxPackageIcon className="size-5 shrink-0" />
            <span className="flex-1 text-left">Your Shop</span>
            <LinkExternalIcon className="size-4 shrink-0 text-grey" />
          </button>
        )}
      </div>
    </aside>
  );
}
