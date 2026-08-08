import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthUser } from "@dealport/shared";

import { serverApi } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";
import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME, IS_PRODUCTION } from "@/lib/env";

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

export async function getSession(): Promise<AuthUser | null> {
  if (!(await hasAuthCookie())) return null;

  try {
    return await serverApi.auth.me();
  } catch (error) {
    if (isApiError(error) && error.isUnauthorized) return null;
    throw error;
  }
}

export async function requireSession(): Promise<AuthUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}
