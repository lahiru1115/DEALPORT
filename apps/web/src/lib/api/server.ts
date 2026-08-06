import "server-only";

import { cookies } from "next/headers";

import { API_URL, AUTH_COOKIE_NAME } from "@/lib/env";

import { createApi } from "./endpoints";
import { executeRequest, type RequestOptions } from "./request";

/**
 * The server transport: straight to NestJS, with the JWT read out of the
 * httpOnly cookie and attached as a Bearer header.
 *
 * This is what server components use. The token is read per request rather
 * than captured once, because a module-scope read would be evaluated at build
 * time and shared across users.
 */
async function serverTransport<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;

  return executeRequest<T>(API_URL, path, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    /*
      Dashboard figures are aggregations over live data and the Product List
      reflects edits made seconds ago, so nothing here may be served from a
      cached render. `no-store` unless a caller deliberately opts into caching.
    */
    cache: options.cache ?? (options.next ? undefined : "no-store"),
  });
}

/** Typed API client for server components and route handlers. */
export const serverApi = createApi(serverTransport);
