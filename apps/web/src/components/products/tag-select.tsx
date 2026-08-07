"use client";

import { ChevronDownIcon } from "lucide-react";
import type { Tag } from "@dealport/shared";

import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * The kit draws this as a plain select, but `tagIds` is an array — a native
 * select cannot express that. This keeps the select's trigger styling and puts
 * a checkbox list behind it, so the control looks as designed while actually
 * being multi-value.
 */
export function TagSelect({
  tags,
  value,
  onChange,
}: {
  tags: Tag[];
  value: string[];
  onChange: (tagIds: string[]) => void;
}) {
  const selected = tags.filter((tag) => value.includes(tag.id));

  function toggle(tagId: string) {
    onChange(
      value.includes(tagId) ? value.filter((id) => id !== tagId) : [...value, tagId],
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex h-12 w-full items-center justify-between gap-2 rounded-lg border border-field-border bg-input py-2 pr-3 pl-4 text-base transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25",
          selected.length === 0 && "text-muted-foreground",
        )}
      >
        <span className="truncate">
          {selected.length === 0
            ? "Select your product"
            : selected.map((tag) => tag.name).join(", ")}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) gap-1">
        {tags.length === 0 ? (
          <p className="text-caption px-1.5 py-2 text-muted-foreground">No tags yet.</p>
        ) : (
          tags.map((tag) => (
            <label
              key={tag.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-2 text-base transition-colors hover:bg-accent"
            >
              <Checkbox
                checked={value.includes(tag.id)}
                onCheckedChange={() => toggle(tag.id)}
              />
              <span className="flex-1 truncate text-cyprus">{tag.name}</span>
              <span className="text-caption text-grey">{tag.productCount}</span>
            </label>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}
