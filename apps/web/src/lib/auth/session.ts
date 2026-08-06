import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthUser } from "@dealport/shared";

import { serverApi } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";
import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME, IS_PRODUCTION } from "@/lib/env";

/**
 * Cookie options, in one place so the login handler and the logout handler
 * cannot disagree about them — a `path` mismatch is the classic way a "logout"
 * silently leaves the cookie in place.
 *
 * `httpOnly` keeps the token out of JavaScript entirely. `sameSite: lax` still
 * sends it on top-level navigations (so a bookmarked `/products` works) while
 * withholding it from cross-site subrequests.
 */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "lax",
  path: "/",
  maxAge: AUTH_COOKIE_MAX_AGE,
} as const;

export async function setAuthCookie(token: string): Promise<void> {
  (await cookies()).set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
}

export async function clearAuthCookie(): Promise<void> {
  (await cookies()).set(AUTH_COOKIE_NAME, "", { ...AUTH_COOKIE_OPTIONS, maxAge: 0 });
}

export async function hasAuthCookie(): Promise<boolean> {
  return Boolean((await cookies()).get(AUTH_COOKIE_NAME)?.value);
}

/**
 * The real session check: ask the API who this token belongs to.
 *
 * Cookie *presence* is not a session — the token may be expired or revoked, and
 * the middleware cannot tell the difference without the signing secret. This
 * calls `GET /auth/me`, so an expired token is caught here rather than showing
 * a fully-rendered shell whose every widget then fails.
 *
 * Returns `null` on 401 so callers can decide; anything else rethrows, because
 * a 500 from the API is not a logged-out user and must not silently look like
 * one.
 */
export async function getSession(): Promise<AuthUser | null> {
  if (!(await hasAuthCookie())) return null;

  try {
    return await serverApi.auth.me();
  } catch (error) {
    if (isApiError(error) && error.isUnauthorized) return null;
    throw error;
  }
}

/**
 * For layouts and pages that cannot render without a user. Redirects to
 * `/login` instead of returning, so callers get a non-null `AuthUser`.
 */
export async function requireSession(): Promise<AuthUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}
