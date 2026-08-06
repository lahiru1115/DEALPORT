import { firstErrorMessage, type ApiErrorBody } from "@dealport/shared";

/**
 * A failed API call, carrying enough for a caller to react to *why* it failed
 * rather than just that it did — 401 sends the user to login, 409 means a
 * duplicate slug/sku, 422 an unsupported upload type.
 *
 * `message` is already unwrapped from the API's `string | string[]` union (the
 * array form is one entry per failed validation constraint), so UI code can
 * render it directly.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null, fallback?: string) {
    super(firstErrorMessage(body, fallback ?? defaultMessageFor(status)));
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  /** Every validation message, for forms that want to show more than the first. */
  get messages(): string[] {
    const message = this.body?.message;
    if (Array.isArray(message)) return message;
    return [this.message];
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to do that.";
    case 404:
      return "That item no longer exists.";
    case 409:
      return "That conflicts with something that already exists.";
    case 413:
      return "That file is too large.";
    case 422:
      return "That file type is not supported.";
    case 500:
    case 502:
    case 503:
      return "The server is having trouble. Please try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
