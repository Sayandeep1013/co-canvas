"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "canvas.theme";
const listeners = new Set<() => void>();

/** Read the currently-applied theme straight from the DOM (source of truth). */
function read(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private mode / storage disabled — non-fatal */
  }
  listeners.forEach((l) => l());
}

export function toggleTheme() {
  setTheme(read() === "dark" ? "light" : "dark");
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * Subscribe a component to the active theme. The DOM attribute is set before
 * hydration by the inline script in layout.tsx, so client reads are correct
 * immediately; SSR falls back to "light".
 */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "light");
}
