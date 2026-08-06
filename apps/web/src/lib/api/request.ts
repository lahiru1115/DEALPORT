import type { ApiErrorBody } from "@dealport/shared";

import { ApiError } from "./errors";

export type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: QueryParams;
  /** Serialised as JSON with the matching content-type. */
  json?: unknown;
  /** Pre-built body (used for `multipart/form-data` uploads). */
  body?: BodyInit;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** Next.js caching controls. Only meaningful on the server transport. */
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
}

/**
 * The single function both transports are built on.
 *
 * Everything the two have in common lives here — URL building, JSON encoding,
 * 204 handling, and turning a non-2xx into a typed `ApiError`. The transports
 * themselves differ only in where they point and how they authenticate.
 */
export async function executeRequest<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", query, json, body, signal, headers = {}, cache, next } = options;

  const url = baseUrl + path + buildQueryString(query);

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  let requestBody = body;
  if (json !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
    requestBody = JSON.stringify(json);
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
    signal,
    cache,
    next,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorBody(response));
  }

  // `DELETE /products/:id` answers 204 — there is no body to parse, and calling
  // .json() on it throws.
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/**
 * Query strings drop `undefined`, `null` and `""` rather than sending them.
 *
 * This matters for the Product List: clearing the search box or selecting the
 * "All Product" tab must *remove* the parameter. Sending `?status=` instead
 * would hit the API's `@IsEnum` validation and 400 on an empty string.
 */
function buildQueryString(query?: QueryParams): string {
  if (!query) return "";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  const serialised = params.toString();
  return serialised ? `?${serialised}` : "";
}

/**
 * Error responses are *usually* the API's JSON error shape, but a proxy error,
 * a gateway timeout or a crash can return HTML or nothing at all. Parsing
 * defensively keeps a 502 from surfacing as an unrelated JSON syntax error.
 */
async function readErrorBody(response: Response): Promise<ApiErrorBody | null> {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as ApiErrorBody;
  } catch {
    return null;
  }
}
