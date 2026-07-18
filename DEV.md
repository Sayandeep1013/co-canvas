# Local development

After restarting Cursor or your laptop, start everything with **one command** from the repo root:

```bash
pnpm dev
```

This runs **both** services in parallel:

| Service | URL | What it does |
|---------|-----|--------------|
| **Web** (Next.js) | http://localhost:3000 | Frontend |
| **Sync** (partyserver + y-partyserver, via `wrangler dev`) | http://localhost:8787 | Realtime collaboration + always-alive persistence |

### Windows (PowerShell)

```powershell
.\scripts\dev.ps1
```

Or from repo root: `pnpm dev`

### Prerequisites

- Node 20+
- pnpm 11+
- **`API_KEY_21ST`** in your Windows user environment (for 21st MCP only — not needed to run the app)

### If ports are stuck

```powershell
# Find what's on 3000 or 8787, then kill the PID if needed
netstat -ano | findstr :3000
netstat -ano | findstr :8787
```

### Sync server

The realtime sync is a Cloudflare Worker (`apps/party`) built on `partyserver` +
`y-partyserver`. Each room slug is its own Durable Object; `onLoad`/`onSave`
persist the Yjs doc to DO storage, so rooms stay alive with zero connected
clients. Deploy to your own Cloudflare account with `pnpm deploy:party`
(see `docs/DEPLOY.md`).
