/** Origin tag for local Yjs transactions — prevents echo loops (docs/04-LOGIC.md §7.4). */
export const YJS_LOCAL_ORIGIN = "canvas-local";

export const SYNC_URL =
  process.env.NEXT_PUBLIC_SYNC_URL?.replace(/\/$/, "") || "ws://localhost:1234";
