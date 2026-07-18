# Deploying CanVas (free)

CanVas is **two services**, both free:

```
┌─────────────┐    wss://       ┌──────────────────────────────┐
│  Web (Next) │ ──────────────▶ │  Sync (partyserver Worker)     │
│   Vercel    │  NEXT_PUBLIC_   │  YOUR Cloudflare account (DO)   │
└─────────────┘  PARTYKIT_HOST  └──────────────────────────────┘
```

Rooms are **always alive**: each room slug is its own Cloudflare Durable Object,
and `onLoad`/`onSave` persist the Yjs doc to DO storage — so a room survives with
zero connected clients and across restarts. No separate database.

---

## 1. Sync server → your Cloudflare account (free)

From the repo root:

```bash
pnpm deploy:party
# (equivalently: cd apps/party && npx wrangler deploy)
```

- First run opens a browser to **log in to Cloudflare** (free account). Approve
  the Wrangler access request.
- It deploys the Worker in `apps/party` (Durable Object `Document`) and prints a
  URL like: `https://canvas-sync.<your-subdomain>.workers.dev`
- Health check: open that URL — it responds `CanVas sync (partyserver): OK`.

That host (without `https://`) is your `NEXT_PUBLIC_PARTYKIT_HOST`.

> First deploy may prompt you to enable a **workers.dev subdomain** — accept it;
> it's free and gives you the `*.workers.dev` URL above.

---

## 2. Web app → Vercel (free)

1. Vercel → **Add New → Project** → import the repo.
2. Settings:
   - **Root Directory:** `apps/web`
   - **Framework Preset:** Next.js (auto-detected)
   - Install/build are automatic (Vercel handles the pnpm workspace).
3. **Environment Variables** → add:
   - `NEXT_PUBLIC_PARTYKIT_HOST` = `canvas-sync.<your-subdomain>.workers.dev`
     *(the host from step 1 — no `https://`, no trailing slash)*
4. Deploy → `https://your-app.vercel.app`.

Open the Vercel URL, create a room, share the link. Done.

---

## Env var reference

| Service | Variable | Value | Required |
|---------|----------|-------|----------|
| Web (Vercel) | `NEXT_PUBLIC_PARTYKIT_HOST` | `canvas-sync.<subdomain>.workers.dev` | ✅ |
| Sync (Cloudflare) | — | none; persistence is built in | — |

Local dev uses `wrangler dev` on `localhost:8787` and the client defaults to it,
so nothing is needed locally.

---

## Notes

- **Custom domain:** both Vercel and Cloudflare support free custom domains.
- **Always-on:** Cloudflare Durable Objects don't cold-sleep like a free Render
  web service — rooms are genuinely always available.
- **Auth:** intentionally none — anyone who knows/guesses a room name joins it.
- **Cost:** Cloudflare's Workers/Durable Objects free tier is generous for a
  hobby app; you only pay if you far exceed it.
