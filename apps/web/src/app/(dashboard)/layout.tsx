import type { ReactNode } from "react";

import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { requireSession } from "@/lib/auth/session";

/**
 * Every authenticated screen. `requireSession()` redirects to `/login` when
 * there is no valid session — `middleware.ts` only checks cookie presence, so
 * this is the layer that actually confirms the token still works.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireSession();

  return (
    <div className="min-h-dvh bg-canvas">
      <Sidebar user={user} />
      <div className="flex min-h-dvh flex-col pl-sidebar">
        <Topbar user={user} />
        {/* Content insets measured off `2 Dashboard.png` / `6 Categories.png` / `8 Add Product.png` — asymmetric on purpose (20 left, 44 right). */}
        <main className="flex-1 py-5 pr-11 pl-5">{children}</main>
      </div>
    </div>
  );
}
