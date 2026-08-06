"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Covers every route under the shell — most importantly the dashboard's
 * `Promise.all([...])` in `dashboard/page.tsx`, which has no per-widget
 * fallback: one failed request currently fails the whole page. `error.tsx`
 * cannot catch errors from the sibling `layout.tsx` (Next's boundary rules),
 * so a `requireSession()` redirect failure is unaffected by this — this is
 * only for the data-fetching pages themselves.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-96 place-items-center">
      <Card className="max-w-sm text-center">
        <p className="mb-2 text-title text-cyprus">Something went wrong</p>
        <p className="text-caption mb-5 text-grey">
          Couldn&apos;t load this page. This has been logged.
        </p>
        <Button onClick={reset}>Try again</Button>
      </Card>
    </div>
  );
}
