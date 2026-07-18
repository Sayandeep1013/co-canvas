import { type HTMLAttributes } from "react";

type Size = "sm" | "md" | "lg";

interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Display name — first letter is shown. */
  name: string;
  /** Identity color (hex) used as the background. */
  color: string;
  size?: Size;
}

const sizes: Record<Size, string> = {
  sm: "h-6 w-6 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

/** Identity avatar — a colored circle with the person's initial. */
export function Avatar({
  name,
  color,
  size = "md",
  className = "",
  ...props
}: AvatarProps) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-canvas-surface ${sizes[size]} ${className}`}
      style={{ backgroundColor: color }}
      aria-hidden
      {...props}
    >
      {initial}
    </span>
  );
}
