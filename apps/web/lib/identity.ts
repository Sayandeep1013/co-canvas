import { Identity, pickColor, randomId } from "@canvas/shared";

const KEY = "canvas.identity.v1";

/**
 * Load the persisted identity (id + name + color) from localStorage, or create
 * a fresh one. The `id` is stable across refreshes so you stay "the same" user.
 * See docs/01-SPEC.md FR-B.
 */
export function getOrCreateIdentity(): Identity {
  if (typeof window === "undefined") {
    // SSR guard — never actually used to render collaborative UI.
    return { id: "ssr", displayName: "…", color: pickColor("ssr") };
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Identity>;
      if (parsed.id && parsed.displayName && parsed.color) {
        return parsed as Identity;
      }
    }
  } catch {
    // ignore malformed storage
  }
  const id = randomId();
  const identity: Identity = {
    id,
    displayName: `guest-${id.slice(0, 4)}`,
    color: pickColor(id),
  };
  saveIdentity(identity);
  return identity;
}

export function saveIdentity(identity: Identity): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(identity));
  } catch {
    // ignore quota / privacy-mode errors
  }
}
