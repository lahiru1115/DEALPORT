import { createApi } from "./endpoints";
import { executeRequest, type RequestOptions } from "./request";

/**
 * The browser transport: same-origin, through the BFF proxy.
 *
 * Client components never see the token or the API origin. They issue an
 * ordinary same-origin `fetch` to `/api/proxy/...`, and the route handler
 * attaches the Bearer header server-side — so an XSS cannot read the
 * credential the way it could read `localStorage`
 * (plans/01-ARCHITECTURE.md §5).
 */
const PROXY_PREFIX = "/api/proxy";

function browserTransport<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return executeRequest<T>(PROXY_PREFIX, path, options);
}

/** Typed API client for client components — pair with TanStack Query. */
export const api = createApi(browserTransport);
