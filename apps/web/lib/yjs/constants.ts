/** Origin tag for local Yjs transactions — prevents echo loops (docs/04-LOGIC.md §7.4). */
export const YJS_LOCAL_ORIGIN = "canvas-local";

/**
 * PartyKit host for the Yjs sync server. Just the host (no protocol) — the
 * provider adds ws/wss itself. Dev defaults to the local `partykit dev` server.
 * In prod set NEXT_PUBLIC_PARTYKIT_HOST to e.g. canvas-sync.<user>.partykit.dev
 */
export const PARTYKIT_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST
    ?.replace(/^https?:\/\//, "")
    .replace(/\/$/, "") || "localhost:1999";
