import type { ReactNode } from "react";

import { DashboardShell } from "@/components/shell/dashboard-shell";
import { requireSession } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireSession();

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
