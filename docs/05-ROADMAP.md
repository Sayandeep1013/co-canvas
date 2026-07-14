# 05 — ROADMAP

> The *in what order*. A phased plan that front-loads risk-reduction and makes sure the hard parts (the Excalidraw↔Yjs binding) land on ground we've already proven. Each phase ends with something you can actually *see working*.

Guiding rule: **prove the scary thing early, small.** We don't build the whole UI and then discover sync is broken. We get one shape syncing between two tabs ASAP, then grow outward.

## Phase 0 — Foundations & "hello sync" (de-risk the core)

Goal: prove the Yjs pipeline end-to-end with the *simplest possible* payload.

- [ ] Monorepo scaffold (`apps/web` Next.js + `apps/sync` Node + `packages/shared`) per [TECH §7](./03-TECH.md).
- [ ] Run the reference `y-websocket` server locally (Blueprint B).
- [ ] Landing → `/r/[room]` route + slugify.
- [ ] Create a `Y.Doc`, attach `WebsocketProvider` + `IndexeddbProvider`.
- [ ] **Milestone:** a single shared counter or text box syncs between two browser tabs, survives refresh (IndexedDB), and reconnects after killing the server. *(If this works, the whole architecture is validated.)*

## Phase 1 — Identity, presence & awareness

Goal: people exist and can see each other.

- [ ] Identity: random `id` + name + color in `localStorage` (FR-B).
- [ ] Identity prompt UI (DESIGN §5).
- [ ] Wire **awareness**: broadcast `{user, activeSurface}`.
- [ ] Presence rail (DESIGN §6.5) from awareness; join/leave via heartbeat timeout.
- [ ] **Milestone:** two tabs show each other in the presence list with correct name+color; closing one removes it within seconds.

## Phase 2 — Notes surface (the easy win)

Goal: real collaborative rich text, minimal custom code.

- [ ] Integrate **BlockNote** bound to `doc.getXmlFragment("notes")` (LOGIC §6).
- [ ] Remote text carets/selections via awareness.
- [ ] Basic blocks: headings, lists, checkboxes, code, divider.
- [ ] **Milestone:** two people co-write a note, see each other's carets, converge with no lost text. Reload → text persists (once Phase 5 lands, across cold starts too).

## Phase 3 — Canvas surface (the hard part)

Goal: collaborative Excalidraw. This is the crux; budget the most time here.

- [ ] Embed `@excalidraw/excalidraw` (client-only).
- [ ] Implement the **Yjs ↔ Excalidraw binding** (LOGIC §7): per-element `Y.Map`, `onChange` diff-by-version (outgoing), `observeDeep` reconcile (incoming).
- [ ] Guards: `origin` echo-gate, in-progress-edit protection, version/versionNonce reconciliation.
- [ ] Throttle outgoing element writes.
- [ ] Remote **cursors** on canvas via `collaborators` from awareness (LOGIC §7.5), with smoothing (LOGIC §8).
- [ ] **Milestone:** two people draw/move/delete shapes simultaneously; both converge; each sees the other's cursor gliding; a drag is never interrupted by a remote update. *(This is the acceptance test #2 from SPEC.)*

## Phase 4 — Surface switcher & room shell

Goal: it becomes "one room, two surfaces."

- [ ] Top bar + Notes/Canvas tabs; keep the inactive surface live in the background.
- [ ] Split view on wide screens (US-17).
- [ ] `activeSurface` reflected in presence ("Aria · 🎨").
- [ ] Share button (copy link) + honest status bar (connecting/reconnecting/saved).
- [ ] **Milestone:** the DESIGN §6 room screen exists and feels like one notebook with two pages.

## Phase 5 — Persistence & media

Goal: rooms remember; images work; the free-tier cold-start story holds.

- [ ] Server-side snapshot save (debounced + on last-leave) and cold load (LOGIC §9.1) → Supabase Postgres.
- [ ] Image upload to Supabase Storage; store only URL refs in the CRDT for **both** surfaces (LOGIC §7.6, §9.2); size cap + downscale.
- [ ] **Milestone:** close everything, wait past idle, reopen → notes + drawing + chat intact; pasted images reload; CRDT payload stays small.

## Phase 6 — Chat & polish

Goal: the MVP feature set is complete and pleasant.

- [ ] Chat as `doc.getArray("chat")` with persisted history + unread badge (FR-E3/E4).
- [ ] PNG/SVG export from canvas (US-14).
- [ ] Empty states, toasts (join/leave, copied), reduced-motion, contrast pass (DESIGN §9–10).
- [ ] Responsive/narrow layout best-effort (DESIGN §8).
- [ ] **Milestone:** all SPEC §5 acceptance tests pass.

## Phase 7 — Deploy on $0 & test with real humans

Goal: it's live and your classmates can use it.

- [ ] Frontend → Vercel Hobby; sync server → Render free (Blueprint B); Supabase free for storage.
- [ ] Set env vars; verify wss:// works in prod; verify cold-start UX.
- [ ] Run a real session with a few classmates; watch for jank, confusion, data loss.
- [ ] **Milestone:** a group uses it unprompted; $0 on the bill.

---

## After MVP — the [LATER] backlog

Roughly in the order that adds the most value:

1. **The bridge (both-worlds payoff):** export a canvas selection *into* the notes as an image (US-23); cross-surface references/links (US-24).
2. **Migrate sync to PartyKit/Durable Objects** (Blueprint A) to kill cold-starts and feel always-on.
3. **Locked rooms / passwords** and a "recent rooms" list.
4. **Version history / time-travel** (switch snapshots → compacted update log; Yjs supports this).
5. **Accounts** (own your rooms, private rooms) — optional, only if demand appears.
6. **Comments/reactions**, templates, presence "follow" mode, dark mode.
7. **Mobile-native** polish if usage warrants it.

## How to use this roadmap

- Treat **Phase 0 and Phase 3 as the risk gates.** If Phase 0 is shaky, fix the pipeline before building UI. If Phase 3's binding is solid, the rest is "just" product work.
- Each milestone is a natural commit/demo point.
- Re-open [SPEC §5](./01-SPEC.md) at the end of each phase and check off acceptance criteria.

---

That's the full documentation set. Back to the [index](./README.md).
