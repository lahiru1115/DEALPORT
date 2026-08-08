import { Suspense } from "react";
import Image from "next/image";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

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

          <Suspense fallback={<div className="h-90" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
