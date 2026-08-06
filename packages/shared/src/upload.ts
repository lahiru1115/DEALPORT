/**
 * `POST /uploads/image` — see plans/02-API.md §5.
 *
 * Upload and product-save are separate calls on purpose: the Add Product screen
 * uploads immediately and holds the returned `url` in form state, so a product
 * save that fails validation never loses images the user already uploaded.
 */
export interface UploadImageResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/** Mirrors the API's own limits, so the client can reject before uploading. */
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

export const UPLOAD_ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type UploadAcceptedMimeType =
  (typeof UPLOAD_ACCEPTED_MIME_TYPES)[number];

/**
 * Returns a human-readable reason the file cannot be uploaded, or `null` if it
 * is acceptable. Checking client-side turns a 413/422 round trip into instant
 * feedback; the API still enforces both limits regardless.
 */
export function validateUploadFile(file: {
  size: number;
  type: string;
}): string | null {
  if (!UPLOAD_ACCEPTED_MIME_TYPES.includes(file.type as UploadAcceptedMimeType)) {
    return "Images must be JPEG, PNG or WebP.";
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    return "Images must be 5MB or smaller.";
  }
  return null;
}
