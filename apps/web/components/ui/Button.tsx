import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-canvas-accent text-white hover:bg-canvas-accent-hover shadow-canvas-sm disabled:opacity-40",
  secondary:
    "border border-canvas-border bg-canvas-surface text-canvas-ink hover:bg-canvas-bg-subtle",
  ghost: "text-canvas-muted hover:text-canvas-ink hover:bg-canvas-bg-subtle",
};

const sizes: Record<Size, string> = {
  sm: "gap-1.5 rounded-lg px-3 py-2 text-sm",
  md: "gap-2 rounded-xl px-4 py-2.5 text-sm",
  icon: "rounded-xl p-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", className = "", children, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent-soft disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  ),
);
Button.displayName = "Button";
