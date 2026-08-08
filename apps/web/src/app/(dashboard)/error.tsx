"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
