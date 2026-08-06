import { Suspense } from "react";
import Image from "next/image";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

/*
  The kit contains no login mockup — the nine screens in `design/screens/` are
  all post-authentication. This is built from the design system instead (Lato,
  ocean-green CTA, filled borderless fields, 12px card on the #F9FAFB canvas),
  so it belongs to the same product without inventing a layout the design
  never specified.
*/
export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-5 py-10">
      <div className="w-full max-w-105">
        <div className="mb-8 flex justify-center">
          <Image
            src="/brand/dealport-logo.svg"
            alt="DEALPORT"
            width={181}
            height={38}
            priority
            className="h-8 w-auto"
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-ambient-3">
          <h1 className="text-section text-cyprus">Welcome back</h1>
          <p className="mt-1 mb-7 text-caption text-grey">
            Sign in to manage your products and orders.
          </p>

          {/*
            `useSearchParams` (for the post-login `?next=`) opts the subtree into
            client-side rendering, so the boundary is required for the page to
            prerender.
          */}
          <Suspense fallback={<div className="h-90" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
