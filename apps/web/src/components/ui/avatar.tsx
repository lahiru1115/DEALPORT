import Image from "next/image";

import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/**
 * `avatarUrl` comes back `null` for a user who hasn't uploaded one — falls
 * back to initials on an ocean-green tint rather than a broken image request.
 */
function Avatar({
  src,
  name,
  size = 40,
  className,
}: {
  src: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-secondary font-bold text-ocean-green",
          className,
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}

export { Avatar };
