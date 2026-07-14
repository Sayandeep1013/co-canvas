/**
 * Shared types + helpers used by BOTH the web app and the sync server.
 * Keeping them here guarantees the awareness/identity/chat shapes never drift
 * between client and server. See docs/03-TECH.md §7.
 */

/** The two editing surfaces inside a room. */
export type SurfaceId = "notes" | "canvas";

/** A user's identity for a session. No account — purely local + ephemeral. */
export interface Identity {
  /** Stable random id kept in localStorage so a refresh keeps you "the same". */
  id: string;
  displayName: string;
  /** Hex color from PALETTE. Identity == color, everywhere in the UI. */
  color: string;
}

/** A live cursor position, scoped to whichever surface the user is on. */
export interface CursorState {
  surface: SurfaceId;
  x: number;
  y: number;
}

/**
 * The full per-connection awareness state (ephemeral, never persisted).
 * See docs/04-LOGIC.md §5.
 */
export interface AwarenessState {
  user: Identity;
  cursor: CursorState | null;
  activeSurface: SurfaceId;
}

/** One chat message. Stored in the persisted Yjs doc (docs/04-LOGIC.md §10). */
export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  color: string;
  text: string;
  /** Wall-clock ms. Display only — ordering comes from the Y.Array. */
  ts: number;
}

/** Curated, high-contrast, colorblind-considerate palette for user colors. */
export const PALETTE: readonly string[] = [
  "#e5484d", // red
  "#e5691d", // orange
  "#d9a400", // amber
  "#46a758", // green
  "#12a594", // teal
  "#0091ff", // blue
  "#3a5ccc", // indigo
  "#8e4ec6", // violet
  "#e93d82", // pink
  "#6e56cf", // purple
  "#00749e", // cyan-dark
  "#ad7f58", // brown
] as const;

/** Turn any typed string into a stable, URL-safe room slug. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // drop punctuation
    .replace(/\s+/g, "-") // spaces -> hyphens
    .replace(/-+/g, "-") // collapse repeats
    .replace(/^-|-$/g, ""); // trim edge hyphens
}

/** Short, reasonably-unique id (not crypto). */
export function randomId(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 6)
  );
}

/** Deterministic-ish color pick so we spread users across the palette. */
export function pickColor(seed?: string): string {
  if (!seed) return PALETTE[Math.floor(Math.random() * PALETTE.length)];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

const ADJECTIVES = [
  "brave", "calm", "clever", "eager", "gentle", "happy", "keen", "lively",
  "mellow", "nimble", "proud", "quiet", "swift", "witty", "zesty", "sunny",
];
const ANIMALS = [
  "otter", "falcon", "koala", "lynx", "panda", "heron", "gecko", "moth",
  "bison", "crane", "ibex", "marten", "quokka", "raven", "tapir", "vole",
];

/** Friendly random room name for the "Surprise me" button (docs/02-DESIGN.md §4). */
export function randomRoomName(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${a}-${n}-${num}`;
}
