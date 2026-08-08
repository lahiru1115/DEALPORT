
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ListResponse<T> {
  data: T[];
}

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
