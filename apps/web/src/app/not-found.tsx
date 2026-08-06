import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Outside the shell — an unmatched top-level route. */
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-5 text-center">
      <div>
        <p className="text-section mb-2 text-cyprus">Page not found</p>
        <p className="text-caption mb-6 text-grey">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
