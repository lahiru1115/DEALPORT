/**
 * Envelopes and the error shape — see plans/02-API.md §1.
 *
 * Single resources come back bare, lists come back wrapped. Both wrappers are
 * declared here so a screen never has to guess which one an endpoint uses.
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** `GET /products` — the only endpoint that paginates. */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * `GET /categories`, `GET /tags`, `GET /dashboard/transactions` — wrapped, but
 * with no pagination because each returns a bounded set.
 */
export interface ListResponse<T> {
  data: T[];
}

/**
 * The single error shape produced by the API's global exception filter.
 *
 * `message` is a string for most failures but a **string array** for validation
 * failures — one entry per failed constraint. Consumers must handle both; the
 * `firstErrorMessage` helper below exists so they don't each reimplement it.
 */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
  path?: string;
  timestamp?: string;
}

export function firstErrorMessage(
  body: ApiErrorBody | null | undefined,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!body) return fallback;
  const { message } = body;
  if (Array.isArray(message)) return message[0] ?? fallback;
  return message || fallback;
}
