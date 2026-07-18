# 06 — UI Audit (current vs spec)

> Audited against [02-DESIGN.md](./02-DESIGN.md) and `.cursor/skills/canvas-ui/SKILL.md`.
> Date: 2026-07-14 · Stack: Tailwind 4, Geist, BlockNote Mantine, Excalidraw.

## Summary

The app **works** but reads as an **early scaffold**, not a product. It hits basic layout but misses the spec’s personality, typography, and “shared notebook” feel. Score: **4/10** on first impression.

## Screen scores

| Screen | Spec intent | Current | Score |
|--------|-------------|---------|-------|
| Landing | One-action entry, playful, distinctive | Centered card, generic blue CTA | 4/10 |
| Identity | Quick gate, color = identity | Functional box, emoji-free but plain | 5/10 |
| Room shell | Thin chrome, alive, two surfaces | Cramped header, emoji tabs, hidden mobile presence | 4/10 |
| Notes | Hero content, collab carets | BlockNote default theme, no shell integration | 6/10 |
| Canvas | Full bleed drawing | Excalidraw default, OK | 7/10 |

## What’s wrong (visual)

1. **Generic palette** — `blue-600`, `neutral-*`, white cards = default AI template. No warm “notebook” identity from DESIGN §2.
2. **Typography broken** — Geist loaded in layout but `globals.css` sets `font-family: Arial` on `body`.
3. **Emoji chrome** — 📝 🎨 🔗 🎲 in header/actions feel hacky vs Lucide + labels.
4. **No design tokens** — colors/spacing hard-coded per component; hard to reskin coherently.
5. **Landing has no brand moment** — no illustration, texture, or motion; could be any CRUD app.

## What’s wrong (UX)

1. **Header overcrowded** on medium widths — logo, slug, tabs, share, status compete on one row.
2. **Presence rail hidden below `lg`** — mobile users lose “who’s here” (DESIGN §6.5).
3. **Share has no feedback** — no “Copied” toast (DESIGN §9).
4. **Identity color not reflected in room** — user picks color but shell doesn’t echo it (only presence dot).
5. **Loading states** — plain “Loading…” / “Connecting…” text, no skeleton or branded spinner.

## What’s right (keep)

- Two-surface model wired correctly (Notes + Canvas, both mounted).
- Status pill concept matches DESIGN §6 (connecting/saved).
- Open room flow is simple (landing → identity → room).
- User color palette in identity prompt matches shared `PALETTE`.

## MCP / skills available

| Resource | Status |
|----------|--------|
| `docs/02-DESIGN.md` | ✅ Project UI spec |
| `.cursor/skills/canvas-ui/SKILL.md` | ✅ Added — agent UI checklist |
| **21st.dev Magic MCP** | ⚠️ Not connected — copy `.cursor/mcp.json.example` → `~/.cursor/mcp.json`, add API key from [21st.dev](https://21st.dev) |
| **Figma MCP** | ⚠️ Not connected — optional for frame-to-code |
| **Matter.js** | ❌ Physics engine, not UI — not applicable |

## Recommended UI stack (next implementation pass)

1. **Design tokens** in `globals.css` (warm bg, ink, accent, borders).
2. **Lucide icons** replace emoji in chrome.
3. **`components/ui/`** — `Button`, `Input`, `SegmentedControl`, `Card` (hand-rolled or shadcn later).
4. **Landing redesign** — subtle background pattern, stronger headline, single focal card.
5. **Room header** — two-row on small screens; segmented control; user color ring on avatar.
6. **Mobile presence** — collapsible bottom bar or icon with count.

## Out of scope for UI-only pass

- Server, hosting, Supabase, chat rail (Phase 6), split view polish (Phase 4 defer).

---

Next step: implement token system + landing + room shell per this audit (no backend changes).
