interface LoaderProps {
  /** Optional label shown beside the animated dots. */
  label?: string;
  className?: string;
}

/** Branded three-dot loader in the accent color. */
export function Loader({ label, className = "" }: LoaderProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 text-canvas-muted ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="canvas-loader" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
