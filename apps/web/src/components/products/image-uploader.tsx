"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import {
  UPLOAD_ACCEPTED_MIME_TYPES,
  validateUploadFile,
  type ProductImageInput,
} from "@dealport/shared";

import {
  ArrowRefreshIcon,
  ImageOutlineIcon,
  CirclePlusFilledIcon,
} from "@/components/icons/generated";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

/**
 * Uploads land on Cloudinary via `POST /uploads/image` the moment a file is
 * chosen, and only the returned URL is held in form state. A failed product
 * save therefore never loses an already-uploaded image (design system §7).
 */
export function ImageUploader({
  images,
  onChange,
}: {
  images: ProductImageInput[];
  onChange: (images: ProductImageInput[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const primary = images.find((image) => image.isPrimary) ?? images[0];

  async function upload(file: File, mode: "add" | "replace") {
    const problem = validateUploadFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }

    setUploading(true);
    try {
      const result = await api.uploads.image(file);
      const uploaded: ProductImageInput = {
        url: result.url,
        publicId: result.publicId,
        isPrimary: mode === "replace" || images.length === 0,
      };

      if (mode === "replace") {
        // The new file becomes primary; the old primary stays as a secondary
        // rather than being discarded, since it is already uploaded.
        onChange([
          uploaded,
          ...images.map((image) => ({ ...image, isPrimary: false })),
        ]);
      } else {
        onChange([...images, uploaded]);
      }
    } catch (error) {
      toast.error(isApiError(error) ? error.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleRemove(index: number) {
    const next = images.filter((_, i) => i !== index);
    // Removing the primary promotes the next image, so a product never ends up
    // with images but no primary.
    if (next.length > 0 && !next.some((image) => image.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true };
    }
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <input
        ref={addInputRef}
        type="file"
        accept={UPLOAD_ACCEPTED_MIME_TYPES.join(",")}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file, "add");
          event.target.value = "";
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept={UPLOAD_ACCEPTED_MIME_TYPES.join(",")}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file, "replace");
          event.target.value = "";
        }}
      />

      <div>
        <p className="mb-2 text-base font-bold text-cyprus">Product Image</p>
        <div className="relative grid min-h-72 place-items-center rounded-xl border border-hairline p-5">
          {primary ? (
            <Image
              src={primary.url}
              alt="Product preview"
              width={280}
              height={280}
              className="max-h-60 w-auto object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-grey">
              <ImageOutlineIcon className="size-10" />
              <p className="text-caption">No image yet</p>
            </div>
          )}

          <div className="absolute inset-x-5 bottom-5 flex items-center justify-between">
            <button
              type="button"
              disabled={uploading}
              onClick={() => addInputRef.current?.click()}
              className="flex h-11 items-center gap-2 rounded-lg border border-hairline bg-white px-4 text-base text-cyprus shadow-ambient-1 transition-colors hover:bg-accent disabled:opacity-50"
            >
              <ImageOutlineIcon className="size-5" />
              Browse
            </button>
            {primary ? (
              <button
                type="button"
                disabled={uploading}
                onClick={() => replaceInputRef.current?.click()}
                className="flex h-11 items-center gap-2 rounded-lg border border-hairline bg-white px-4 text-base text-cyprus shadow-ambient-1 transition-colors hover:bg-accent disabled:opacity-50"
              >
                <ArrowRefreshIcon className="size-5" />
                Replace
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div
            key={`${image.url}-${index}`}
            className={cn(
              "relative aspect-square overflow-hidden rounded-xl border bg-white",
              image.isPrimary ? "border-primary" : "border-hairline",
            )}
          >
            <Image
              src={image.url}
              alt={`Product image ${index + 1}`}
              fill
              sizes="160px"
              className="object-contain p-3"
            />
            <button
              type="button"
              aria-label={`Remove image ${index + 1}`}
              onClick={() => handleRemove(index)}
              className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-white/90 text-grey shadow-ambient-1 transition-colors hover:text-error"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          disabled={uploading}
          onClick={() => addInputRef.current?.click()}
          className="grid aspect-square place-items-center rounded-xl border border-dashed border-primary/50 text-primary transition-colors hover:bg-accent disabled:opacity-50"
        >
          <span className="flex flex-col items-center gap-1.5">
            <CirclePlusFilledIcon className="size-6" />
            <span className="text-caption">{uploading ? "Uploading…" : "Add Image"}</span>
          </span>
        </button>
      </div>
    </div>
  );
}
