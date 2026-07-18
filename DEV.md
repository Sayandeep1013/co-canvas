# Local development

After restarting Cursor or your laptop, start everything with **one command** from the repo root:

```bash
pnpm dev
```

This runs **both** services in parallel:

| Service | URL | What it does |
|---------|-----|--------------|
| **Web** (Next.js) | http://localhost:3000 | Frontend |
| **Sync** (Yjs relay) | ws://localhost:1234 | Realtime collaboration |

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
# Find what's on 3000 or 1234, then kill the PID if needed
netstat -ano | findstr :3000
netstat -ano | findstr :1234
```

### Verify sync works

```bash
node apps/web/scripts/test-sync.mjs
```

Should print `PASS: converged`.
