import { createApi } from "./endpoints";
import { executeRequest, type RequestOptions } from "./request";

const PROXY_PREFIX = "/api/proxy";

function browserTransport<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return executeRequest<T>(PROXY_PREFIX, path, options);
}

export const api = createApi(browserTransport);
