import { type HTMLAttributes } from "react";

type Variant = "neutral" | "surface";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  neutral: "bg-canvas-bg-subtle text-canvas-muted",
  surface: "border border-canvas-border bg-canvas-surface text-canvas-muted",
};

/** Small pill for eyebrows, status labels, and surface tags. */
export function Badge({
  variant = "surface",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
