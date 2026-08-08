"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { loginSchema, type ApiErrorBody, type LoginInput } from "@dealport/shared";
import { firstErrorMessage } from "@dealport/shared";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DEMO_CREDENTIALS: LoginInput = {
  email: "admin@dealport.com",
  password: "Admin@123",
};

function safeRedirectTarget(next: string | null): string {
  if (!next) return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function performLogin(values: LoginInput) {
    setFormError(null);

    let response: Response;
    try {
      response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    } catch {
      setFormError("Could not reach the server. Please check your connection.");
      return;
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
      setFormError(firstErrorMessage(body, "Invalid email or password."));
      return;
    }

    router.refresh();
    router.push(safeRedirectTarget(searchParams.get("next")));
  }

  async function handleDemoLogin() {
    setIsDemoLoading(true);
    try {
      await performLogin(DEMO_CREDENTIALS);
    } finally {
      setIsDemoLoading(false);
    }
  }

  const busy = isSubmitting || isDemoLoading;

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(performLogin)} noValidate className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="font-bold text-cyprus">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <p id="email-error" className="text-caption text-error">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="font-bold text-cyprus">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pr-12"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className={cn(
                "absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-lg",
                "text-grey transition-colors hover:text-cyprus",
                "focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none",
              )}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOffIcon className="size-5" />
              ) : (
                <EyeIcon className="size-5" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p id="password-error" className="text-caption text-error">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        {formError ? (
          <p
            role="alert"
            className="rounded-lg border border-error/20 bg-error/8 px-4 py-3 text-caption text-error"
          >
            {formError}
          </p>
        ) : null}

        <Button type="submit" disabled={busy} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2Icon className="animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-hairline" />
        <span className="text-caption text-grey">or</span>
        <div className="h-px flex-1 bg-hairline" />
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={handleDemoLogin}
        className="w-full"
      >
        {isDemoLoading ? (
          <>
            <Loader2Icon className="animate-spin" />
            Signing in…
          </>
        ) : (
          "Continue with demo account"
        )}
      </Button>
    </div>
  );
}
