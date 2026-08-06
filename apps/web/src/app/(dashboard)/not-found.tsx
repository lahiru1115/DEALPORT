import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Rendered inside the shell (sidebar + topbar) — e.g. a bad `/products/:id/edit` id. */
export default function DashboardNotFound() {
  return (
    <div className="grid min-h-96 place-items-center">
      <Card className="max-w-sm text-center">
        <p className="mb-2 text-title text-cyprus">Not found</p>
        <p className="text-caption mb-5 text-grey">
          That page or product doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </Card>
    </div>
  );
}
