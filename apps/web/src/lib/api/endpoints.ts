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

export type Transport = <T>(path: string, options?: RequestOptions) => Promise<T>;

type CallOptions = Pick<RequestOptions, "signal" | "cache" | "next">;

export function createApi(request: Transport) {
  return {
    auth: {
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

      remove: (id: string, options?: CallOptions) =>
        request<void>(`/products/${id}`, { ...options, method: "DELETE" }),

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
      image: (file: File, productId?: string, options?: CallOptions) => {
        const form = new FormData();
        form.append("file", file);
        if (productId) form.append("productId", productId);
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
