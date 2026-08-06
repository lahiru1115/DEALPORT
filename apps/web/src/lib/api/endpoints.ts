import type {
  AuthUser,
  Category,
  CreateProductPayload,
  DashboardReport,
  DashboardStats,
  ListResponse,
  PaginatedResponse,
  Product,
  ProductQuery,
  ReportRange,
  Tag,
  Transaction,
  UpdateProductPayload,
  UploadImageResult,
  WidgetProduct,
} from "@dealport/shared";

import type { RequestOptions } from "./request";

/** How a call is actually sent. Supplied by the server or browser transport. */
export type Transport = <T>(path: string, options?: RequestOptions) => Promise<T>;

/** Per-call overrides a caller may pass through (caching, abort signals). */
type CallOptions = Pick<RequestOptions, "signal" | "cache" | "next">;

/**
 * Every endpoint in plans/02-API.md, typed against `@dealport/shared`.
 *
 * Declared once and given a transport, so the server client (direct to NestJS
 * with a Bearer header) and the browser client (same-origin through the BFF
 * proxy) cannot drift apart. Adding an endpoint here makes it available to both
 * with the same types; there is no second list to keep in sync.
 */
export function createApi(request: Transport) {
  return {
    auth: {
      /** Renders the sidebar user card, and doubles as the session check. */
      me: (options?: CallOptions) => request<AuthUser>("/auth/me", options),
    },

    products: {
      list: (query?: ProductQuery, options?: CallOptions) =>
        request<PaginatedResponse<Product>>("/products", {
          ...options,
          query: query as Record<string, string | number | boolean | undefined>,
        }),

      get: (id: string, options?: CallOptions) =>
        request<Product>(`/products/${id}`, options),

      create: (payload: CreateProductPayload, options?: CallOptions) =>
        request<Product>("/products", { ...options, method: "POST", json: payload }),

      update: (id: string, payload: UpdateProductPayload, options?: CallOptions) =>
        request<Product>(`/products/${id}`, {
          ...options,
          method: "PATCH",
          json: payload,
        }),

      /** 204, no body. */
      remove: (id: string, options?: CallOptions) =>
        request<void>(`/products/${id}`, { ...options, method: "DELETE" }),

      /*
        The two widget endpoints the brief names explicitly (§4.1) as having to
        come from the NestJS API. Both return a bare array, not a `data`
        wrapper — unlike categories and tags.
      */
      top: (limit = 4, options?: CallOptions) =>
        request<WidgetProduct[]>("/products/top", { ...options, query: { limit } }),

      bestSelling: (limit = 4, options?: CallOptions) =>
        request<WidgetProduct[]>("/products/best-selling", {
          ...options,
          query: { limit },
        }),
    },

    categories: {
      list: (options?: CallOptions) =>
        request<ListResponse<Category>>("/categories", options),
    },

    tags: {
      list: (options?: CallOptions) => request<ListResponse<Tag>>("/tags", options),
    },

    dashboard: {
      stats: (options?: CallOptions) =>
        request<DashboardStats>("/dashboard/stats", options),

      report: (range: ReportRange = "this-week", options?: CallOptions) =>
        request<DashboardReport>("/dashboard/report", { ...options, query: { range } }),

      transactions: (limit = 5, options?: CallOptions) =>
        request<ListResponse<Transaction>>("/dashboard/transactions", {
          ...options,
          query: { limit },
        }),
    },

    uploads: {
      /**
       * `multipart/form-data`, field name `file`.
       *
       * The content-type header is *not* set here on purpose — the browser has
       * to generate it so it can include the multipart boundary. Setting it
       * manually produces a boundary-less header and the API rejects the body.
       */
      image: (file: File, options?: CallOptions) => {
        const form = new FormData();
        form.append("file", file);
        return request<UploadImageResult>("/uploads/image", {
          ...options,
          method: "POST",
          body: form,
        });
      },
    },
  };
}

export type Api = ReturnType<typeof createApi>;
