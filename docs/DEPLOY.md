# Deploying CanVas (free)

CanVas is **two services**, both with free tiers:

```
┌─────────────┐    wss://       ┌────────────────────────────┐
│  Web (Next) │ ──────────────▶ │  Sync (PartyKit + y-partykit) │
│   Vercel    │  NEXT_PUBLIC_   │  Cloudflare Durable Objects   │
└─────────────┘  PARTYKIT_HOST  └────────────────────────────┘
```

Rooms are **always alive**: each room slug is its own Durable Object and
`persist: { mode: "snapshot" }` snapshots the doc to storage, so a room survives
with zero connected clients and across restarts. No separate database needed.

---

## 1. Sync server → PartyKit (free)

From the repo root:

```bash
pnpm deploy:party
# (equivalently: cd apps/party && npx partykit deploy)
```

- First run prompts a **GitHub login** (PartyKit auth) — free, no Cloudflare
  account of your own required; PartyKit hosts it on Cloudflare for you.
- It deploys the worker in `apps/party` and prints a host like:
  `canvas-sync.<your-username>.partykit.dev`
- Health check: open `https://canvas-sync.<user>.partykit.dev/parties/main/health`
  or just the host — the server responds `CanVas sync (PartyKit): OK`.

That host (without protocol) is your `NEXT_PUBLIC_PARTYKIT_HOST`.

---

## 2. Web app → Vercel (free)

1. Vercel → **Add New → Project** → import the repo.
2. Settings:
   - **Root Directory:** `apps/web`
   - **Framework Preset:** Next.js (auto-detected)
   - Install/build are automatic (Vercel handles the pnpm workspace).
3. **Environment Variables** → add:
   - `NEXT_PUBLIC_PARTYKIT_HOST` = `canvas-sync.<your-username>.partykit.dev`
     *(the host from step 1 — no `https://`, no trailing slash)*
4. Deploy → `https://your-app.vercel.app`.

Open the Vercel URL, create a room, share the link. Done.

---

## Env var reference

| Service | Variable | Value | Required |
|---------|----------|-------|----------|
| Web (Vercel) | `NEXT_PUBLIC_PARTYKIT_HOST` | `canvas-sync.<user>.partykit.dev` | ✅ |
| Sync (PartyKit) | — | none; persistence is built in | — |

Local dev uses `partykit dev` on `localhost:1999` and the client defaults to it,
so nothing is needed locally.

---

## Notes

- **Custom domain:** both Vercel and PartyKit support custom domains on free tiers.
- **Scaling / limits:** PartyKit's free tier is generous for a hobby app; Durable
  Objects are always-on (no cold-start sleep like a free Render web service).
- **Auth:** intentionally none — anyone who knows/guesses a room name joins it.
