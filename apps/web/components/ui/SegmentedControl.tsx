import type { ReactNode } from "react";

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex rounded-xl border border-canvas-border bg-canvas-bg-subtle/50 p-1 ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-canvas-surface text-canvas-ink shadow-sm"
                : "text-canvas-muted hover:text-canvas-ink"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
