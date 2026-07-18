/** Origin tag for local Yjs transactions — prevents echo loops (docs/04-LOGIC.md §7.4). */
export const YJS_LOCAL_ORIGIN = "canvas-local";

/**
 * Host for the Yjs sync server (partyserver on Cloudflare). Just the host (no
 * protocol) — the provider adds ws/wss itself. Dev defaults to the local
 * `wrangler dev` server. In prod set NEXT_PUBLIC_PARTYKIT_HOST to your deployed
 * worker, e.g. canvas-sync.<your-subdomain>.workers.dev
 */
export const PARTYKIT_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST
    ?.replace(/^https?:\/\//, "")
    .replace(/\/$/, "") || "localhost:8787";

/** DO binding "Document" → kebab-cased party the client connects to. */
export const PARTY_NAME = "document";
