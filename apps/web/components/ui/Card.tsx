import { type HTMLAttributes, forwardRef } from "react";

type Elevation = "flat" | "sm" | "md";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation;
}

const elevations: Record<Elevation, string> = {
  flat: "",
  sm: "shadow-canvas-sm",
  md: "shadow-canvas-md",
};

/** Surface panel: border + warm surface + radius, with an optional elevation. */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ elevation = "flat", className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-2xl border border-canvas-border bg-canvas-surface ${elevations[elevation]} ${className}`}
      {...props}
    >
      {children}
    </div>
  ),
);
Card.displayName = "Card";
