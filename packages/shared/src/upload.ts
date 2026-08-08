export interface UploadImageResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

export const UPLOAD_ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type UploadAcceptedMimeType =
  (typeof UPLOAD_ACCEPTED_MIME_TYPES)[number];

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
