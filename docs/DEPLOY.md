# Deploying CanVas (free)

CanVas is **two services**. Both have free tiers.

```
┌─────────────┐     wss://       ┌──────────────────┐
│  Web (Next) │ ───────────────▶ │  Sync (Yjs relay) │
│   Vercel    │  NEXT_PUBLIC_    │   Render (Node)   │
└─────────────┘   SYNC_URL       └──────────────────┘
```

No database is required. Rooms live in the sync server's memory + each
browser's IndexedDB. (Optional durable storage is noted at the bottom.)

---

## 1. Sync server → Render (free)

1. Push this repo to GitHub (done: `co-canvas`).
2. Render → **New → Web Service** → connect the repo.
3. Settings:
   - **Root Directory:** *(leave blank — repo root)*
   - **Runtime:** Node
   - **Build Command:** `corepack enable && pnpm install`
   - **Start Command:** `node apps/sync/server.js`
   - **Instance Type:** Free
4. Deploy. You'll get a URL like `https://canvas-sync.onrender.com`.
   Visiting it in a browser should print `CanVas sync server: OK`.
5. Your WebSocket URL is the same host with `wss://`:
   `wss://canvas-sync.onrender.com`

> **Free-tier caveat:** Render free web services **sleep after ~15 min idle**
> and cold-start (~50s) on the next visit. Data isn't lost — when a returning
> client reconnects, its IndexedDB copy re-seeds the room. For a *truly*
> always-on free relay, see "Upgrade path" below.

No env vars are needed on the sync server (Render injects `PORT`; the server
binds `0.0.0.0`).

---

## 2. Web app → Vercel (free)

1. Vercel → **Add New → Project** → import the repo.
2. Settings:
   - **Root Directory:** `apps/web`
   - **Framework Preset:** Next.js (auto-detected)
   - Install/build are auto — Vercel handles the pnpm workspace.
3. **Environment Variables** → add:
   - `NEXT_PUBLIC_SYNC_URL` = `wss://canvas-sync.onrender.com`
     *(your Render URL from step 1, with `wss://`)*
4. Deploy. You'll get `https://your-app.vercel.app`.

That's it — open the Vercel URL, create a room, share the link.

---

## Env var reference

| Service | Variable | Value | Required |
|---------|----------|-------|----------|
| Web (Vercel) | `NEXT_PUBLIC_SYNC_URL` | `wss://<sync-host>` | ✅ |
| Sync (Render) | `PORT` | injected by host | auto |
| Sync (Render) | `HOST` | defaults to `0.0.0.0` | no |

---

## Upgrade path (later, optional)

- **Always-on free relay:** port the sync server to **Cloudflare Workers +
  Durable Objects** (e.g. via PartyKit or `y-sweet`). Cloudflare's free tier is
  always-on and global — no sleeping. Requires rewriting `apps/sync` (the raw
  `ws` server can't run on Workers as-is).
- **Durable rooms that survive a full restart with no clients:** add Yjs
  persistence via `setPersistence()` — LevelDB on a disk volume (needs a host
  with a persistent disk, e.g. a Render paid disk or Fly volume), or snapshot
  to Postgres/Supabase/S3.
- **Custom domain:** both Vercel and Render support free custom domains.

None of these are needed for a working free MVP.
