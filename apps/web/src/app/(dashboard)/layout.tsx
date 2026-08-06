import type { ReactNode } from "react";

import { DashboardShell } from "@/components/shell/dashboard-shell";
import { requireSession } from "@/lib/auth/session";

/**
 * Every authenticated screen. `requireSession()` redirects to `/login` when
 * there is no valid session — `middleware.ts` only checks cookie presence, so
 * this is the layer that actually confirms the token still works.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireSession();

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
