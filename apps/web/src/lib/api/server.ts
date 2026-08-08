import "server-only";

import { cookies } from "next/headers";

import { API_URL, AUTH_COOKIE_NAME } from "@/lib/env";

import { createApi } from "./endpoints";
import { executeRequest, type RequestOptions } from "./request";

async function serverTransport<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;

  return executeRequest<T>(API_URL, path, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: options.cache ?? (options.next ? undefined : "no-store"),
  });
}

export const serverApi = createApi(serverTransport);
