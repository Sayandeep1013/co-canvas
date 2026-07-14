# CanVas — Documentation

> A room-based, realtime collaborative workspace that is **both** a proper document editor **and** a freeform drawing canvas. Think "Excalidraw meets a block editor," shared live with your classmates and colleagues — no login, just create or join a room by name.

This folder is the single source of truth for **what** we're building, **why**, and **how**. Read the docs in order the first time; after that, jump to whatever you need.

## Reading order

| # | Doc | What it answers |
|---|-----|-----------------|
| 00 | [IDEA](./00-IDEA.md) | The vision, who it's for, the "text editor vs canvas" problem and our answer. The *why*. |
| 01 | [SPEC](./01-SPEC.md) | Concrete requirements, user stories, and exactly what is / isn't in the MVP. The *what*. |
| 02 | [DESIGN](./02-DESIGN.md) | Screens, flows, the two-surface UX, visual language. The *how it feels*. |
| 03 | [TECH](./03-TECH.md) | Architecture, stack, data model, and **free-tier hosting** explained end-to-end. The *how it's built*. |
| 04 | [LOGIC](./04-LOGIC.md) | The hard part, taught from first principles: CRDTs, Yjs, awareness, binding a canvas to a CRDT, persistence. The *how it actually works*. |
| 05 | [ROADMAP](./05-ROADMAP.md) | Phased build plan, from "hello world" to shipped, with milestones. The *in what order*. |

## The one-paragraph summary

Users open the site, type any string to **create or join a room** (e.g. `data-structures-notes`). Inside a room there are two synchronized surfaces: a **Notes** editor (rich text / blocks) and a **Canvas** (Excalidraw). Everyone in the room sees each other's edits, cursors, and presence **in realtime**. Everything is stored in a single **Yjs CRDT document** per room, synced over WebSockets and **persisted** so the room is still there when you come back. No accounts — you just pick a name and a color.

## Locked-in decisions (from our brainstorm)

These are settled unless we deliberately revisit them:

- **Canvas engine:** reuse [`@excalidraw/excalidraw`](https://github.com/excalidraw/excalidraw), don't rebuild it.
- **Realtime:** **Yjs** (CRDT) over WebSockets — no hand-written conflict resolution.
- **Text editor:** a Yjs-native block editor (**BlockNote**, built on TipTap/ProseMirror).
- **Two surfaces, one doc:** Notes + Canvas share a single Yjs document per room.
- **Identity:** anonymous — pick a display name + color, no login.
- **Rooms:** open access, join by typing the room name or via a link. No passwords (MVP).
- **Persistence:** rooms and their content survive; reopen later and it's all there.
- **Scale target:** 2–10 concurrent editors per room.
- **Stack:** Next.js (React) frontend.
- **Budget:** **$0** — every piece must run on a free tier (see [TECH](./03-TECH.md)).
- **MVP features:** live cursors, presence list, text chat, image paste/attach, PNG/SVG export, shareable link.

## Glossary (so the rest of the docs read smoothly)

- **Room** — a named shared space. The string you type *is* the room. Contains one Notes surface + one Canvas surface.
- **Surface** — one of the two editing views in a room: **Notes** or **Canvas**.
- **CRDT** — Conflict-free Replicated Data Type. A data structure that multiple people can edit at once and *always* converges to the same result without a central referee. Explained properly in [LOGIC](./04-LOGIC.md).
- **Yjs** — the specific CRDT library we use.
- **Awareness** — Yjs's side-channel for *ephemeral* state (cursor position, name, color, selection) that is **not** saved to the document.
- **Provider** — the transport that carries Yjs updates between clients (for us: a WebSocket server).
- **Presence** — the list of who is currently in the room, derived from awareness.
