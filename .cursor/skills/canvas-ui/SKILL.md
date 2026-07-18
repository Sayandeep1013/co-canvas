---
name: canvas-ui
description: >-
  Design and implement CanVas UI (landing, identity, room shell, presence rail).
  Use when building or reviewing frontend visuals, layout, typography, tokens,
  component polish, or when the user mentions UI, design, first impressions,
  or 21st.dev / shadcn-style components for this project.
---

# CanVas UI Skill

Ground truth: [docs/02-DESIGN.md](../../docs/02-DESIGN.md) and [docs/00-IDEA.md](../../docs/00-IDEA.md).

## Product feel (one line)

**A shared notebook** — warm, calm, alive — where notes and drawings live in one room. Not a generic SaaS dashboard.

## Design principles (enforce these)

1. **Frictionless in** — landing is one field, one action; identity is one step.
2. **Content is hero** — chrome is thin; editors get maximum space.
3. **Alive** — presence, sync status, and user colors are visible but quiet.
4. **Two surfaces, one room** — Notes ↔ Canvas switch must feel like turning a page, not switching apps.
5. **Honest states** — connecting / reconnecting / saved always visible, never alarming.

## Visual language

| Token | Use |
|-------|-----|
| `--canvas-bg` | Page background (warm off-white, not pure `#fff`) |
| `--canvas-surface` | Cards, panels, header |
| `--canvas-ink` | Primary text |
| `--canvas-muted` | Secondary text, labels |
| `--canvas-border` | Dividers, input borders |
| `--canvas-accent` | Primary actions, active tab (brand — not generic `blue-600`) |
| `--canvas-accent-soft` | Focus rings, hover washes |
| User `identity.color` | Presence dots, carets, chat tags only — never the whole UI |

- **Typography:** Geist Sans for UI; Geist Mono for room slug / code. Never leave `Arial` as body font.
- **Icons:** Lucide React — no emoji in primary chrome (📝/🎨/🔗/🎲 are OK as secondary hints only until replaced).
- **Radius:** `rounded-xl` inputs/cards; `rounded-lg` buttons in dense areas.
- **Shadow:** one level — `shadow-sm` on elevated cards only; room header uses border, not heavy shadow.
- **Motion:** 150–200ms transitions; respect `prefers-reduced-motion`.

## Screen checklist

### Landing
- [ ] Clear headline + one-line value prop
- [ ] Single room-name field + primary CTA
- [ ] "Surprise me" as secondary text button
- [ ] Micro-copy explains create-or-join
- [ ] Visually distinctive (not default Next.js template)

### Identity prompt
- [ ] Room name visible
- [ ] Name input + color palette grid
- [ ] Enter disabled until name non-empty
- [ ] Feels like a gate, not a signup form

### Room shell
- [ ] Top bar: logo · room slug · surface switcher · share · status
- [ ] Surface switcher: segmented control, not three loose buttons
- [ ] Right rail (desktop): presence + name edit
- [ ] Mobile: presence/status accessible (bottom sheet or compact bar — defer split view)
- [ ] Notes and Canvas both mounted; hidden via CSS when inactive

## Component patterns

- **Primary button:** filled accent, `font-medium`, min height 44px on touch targets.
- **Input:** border + focus ring using `--canvas-accent-soft`; no default browser outline only.
- **Segmented control:** inactive = transparent; active = accent fill or strong border.
- **Presence row:** color dot + name + optional surface badge; `(you)` muted.
- **Status pill:** dot + short label (`Saved`, `Connecting…`, `Reconnecting…`).

## Anti-patterns (never ship)

- Generic `blue-600` + white card + gray-500 text (AI slop)
- Emoji as the only icon system in the header
- `font-family: Arial` on body while Geist is loaded
- BlockNote/Excalidraw fighting the shell (give editors full bleed inside main)
- Heavy gradients, glassmorphism everywhere, or dark-mode-only polish before light is solid
- Hiding sync errors; use calm honest copy instead

## External tools (optional)

| Tool | Role | Setup |
|------|------|-------|
| **21st.dev Magic MCP** | Generate/refine React components from prompts | See `.cursor/mcp.json.example` — needs `TWENTY_FIRST_API_KEY` |
| **Figma MCP** | Implement from frames | Cursor: add Figma MCP + paste frame link |
| **shadcn/ui** | Accessible primitives | `pnpm dlx shadcn@latest init` in `apps/web` if we adopt a component library |

**Note:** Matter.js is a 2D physics engine — not a UI tool. Do not use it for layout/chrome.

## UI review workflow

When asked to review or improve UI:

1. Read changed components + `globals.css`.
2. Score against this checklist (pass / fail per screen).
3. List top 3 visual issues and top 3 UX issues.
4. Propose token-level fixes before one-off class patches.
5. Implement smallest diff that moves the whole app toward one coherent system.

## File map

```
apps/web/
├── app/globals.css          # design tokens
├── app/page.tsx             # landing
├── components/
│   ├── Room.tsx             # room shell
│   ├── IdentityPrompt.tsx
│   ├── PresenceRail.tsx
│   ├── NotesSurface.tsx     # keep chrome minimal
│   └── CanvasSurface.tsx    # full bleed
└── components/ui/           # shared primitives (Button, Input, …)
```
