"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
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
import { cn } from "@/lib/utils";

type UploaderItem =
  | { id: string; status: "uploaded"; url: string; publicId?: string; isPrimary: boolean }
  | { id: string; status: "pending"; file: File; previewUrl: string; isPrimary: boolean };

export interface ImageUploaderHandle {
  commitUploads: (productId?: string) => Promise<ProductImageInput[]>;
}

export const ImageUploader = forwardRef<
  ImageUploaderHandle,
  {
    images: ProductImageInput[];
    onChange: (images: ProductImageInput[]) => void;
  }
>(function ImageUploader({ images, onChange }, ref) {
  const [items, setItems] = useState<UploaderItem[]>(() =>
    images.map((image, index) => ({
      id: `existing-${index}`,
      status: "uploaded",
      url: image.url,
      publicId: image.publicId,
      isPrimary: Boolean(image.isPrimary),
    })),
  );
  const [committing, setCommitting] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        if (item.status === "pending") URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    async commitUploads(productId?: string) {
      setCommitting(true);
      try {
        let current = itemsRef.current;
        for (const item of itemsRef.current) {
          if (item.status !== "pending") continue;
          const result = await api.uploads.image(item.file, productId);
          URL.revokeObjectURL(item.previewUrl);
          current = current.map((entry) =>
            entry.id === item.id
              ? {
                  id: entry.id,
                  status: "uploaded" as const,
                  url: result.url,
                  publicId: result.publicId,
                  isPrimary: entry.isPrimary,
                }
              : entry,
          );
          setItems(current);
        }

        const resolved: ProductImageInput[] = current.map((entry) => ({
          url: entry.status === "uploaded" ? entry.url : entry.previewUrl,
          publicId: entry.status === "uploaded" ? entry.publicId : undefined,
          isPrimary: entry.isPrimary,
        }));
        onChange(resolved);
        return resolved;
      } finally {
        setCommitting(false);
      }
    },
  }));

  const primary = items.find((item) => item.isPrimary) ?? items[0];

  function stage(file: File, mode: "add" | "replace") {
    const problem = validateUploadFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }

    const item: UploaderItem = {
      id: `new-${nextId.current++}`,
      status: "pending",
      file,
      previewUrl: URL.createObjectURL(file),
      isPrimary: mode === "replace" || items.length === 0,
    };

    if (mode === "replace") {
      setItems([item, ...items.map((existing) => ({ ...existing, isPrimary: false }))]);
    } else {
      setItems([...items, item]);
    }
  }

  function handleRemove(id: string) {
    const target = items.find((item) => item.id === id);
    if (target?.status === "pending") URL.revokeObjectURL(target.previewUrl);

    const next = items.filter((item) => item.id !== id);
    if (next.length > 0 && !next.some((item) => item.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true };
    }
    setItems(next);
  }

  function srcFor(item: UploaderItem) {
    return item.status === "uploaded" ? item.url : item.previewUrl;
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
          if (file) stage(file, "add");
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
          if (file) stage(file, "replace");
          event.target.value = "";
        }}
      />

      <div>
        <p className="mb-2 text-base font-bold text-cyprus">Product Image</p>
        <div className="relative grid min-h-72 place-items-center rounded-xl border border-hairline p-5">
          {primary ? (
            <Image
              src={srcFor(primary)}
              alt="Product preview"
              width={280}
              height={280}
              unoptimized={primary.status === "pending"}
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
              disabled={committing}
              onClick={() => addInputRef.current?.click()}
              className="flex h-11 items-center gap-2 rounded-lg border border-hairline bg-white px-4 text-base text-cyprus shadow-ambient-1 transition-colors hover:bg-accent disabled:opacity-50"
            >
              <ImageOutlineIcon className="size-5" />
              Browse
            </button>
            {primary ? (
              <button
                type="button"
                disabled={committing}
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
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "relative aspect-square overflow-hidden rounded-xl border bg-white",
              item.isPrimary ? "border-primary" : "border-hairline",
            )}
          >
            <Image
              src={srcFor(item)}
              alt={`Product image ${index + 1}`}
              fill
              sizes="160px"
              unoptimized={item.status === "pending"}
              className="object-contain p-3"
            />
            <button
              type="button"
              aria-label={`Remove image ${index + 1}`}
              disabled={committing}
              onClick={() => handleRemove(item.id)}
              className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-white/90 text-grey shadow-ambient-1 transition-colors hover:text-error disabled:opacity-50"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          disabled={committing}
          onClick={() => addInputRef.current?.click()}
          className="grid aspect-square place-items-center rounded-xl border border-dashed border-primary/50 text-primary transition-colors hover:bg-accent disabled:opacity-50"
        >
          <span className="flex flex-col items-center gap-1.5">
            <CirclePlusFilledIcon className="size-6" />
            <span className="text-caption">{committing ? "Uploading…" : "Add Image"}</span>
          </span>
        </button>
      </div>
    </div>
  );
});
