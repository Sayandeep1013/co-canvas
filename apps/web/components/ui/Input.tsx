import { type InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full rounded-xl border border-canvas-border bg-canvas-surface px-4 py-3 text-base text-canvas-ink placeholder:text-canvas-muted/60 outline-none transition focus:border-canvas-accent focus:ring-2 focus:ring-canvas-accent-soft ${className}`}
    {...props}
  />
));
Input.displayName = "Input";
