import "server-only";

/**
 * Server-side environment.
 *
 * None of these are `NEXT_PUBLIC_`, deliberately. The browser never talks to
 * the NestJS API directly — it goes through the BFF proxy at
 * `/api/proxy/[...path]` — so the API origin stays out of the client bundle
 * entirely (plans/01-ARCHITECTURE.md §5). The `server-only` import above turns
 * an accidental client import of this file into a build error rather than a
 * leak.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Copy apps/web/.env.example to apps/web/.env and fill it in.`,
    );
  }
  return value;
}

/** Base URL of the NestJS API, e.g. `http://localhost:4000`. No trailing slash. */
export const API_URL = required("API_URL", process.env.API_URL).replace(/\/+$/, "");

export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "dealport_token";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Cookie lifetime, matched to the API's `JWT_EXPIRES_IN` default of 7d.
 *
 * Keeping these equal matters: a cookie that outlives its token leaves the user
 * looking logged in while every request 401s, and a cookie that expires first
 * logs them out while the token is still perfectly good.
 */
export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
