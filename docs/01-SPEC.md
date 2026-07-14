# 01 — SPEC

> The *what*. Concrete, testable requirements and the exact MVP boundary. If it's not here, it's not in scope yet.

Notation:
- **[MUST]** — required for MVP.
- **[SHOULD]** — strongly wanted; cut only under pressure.
- **[LATER]** — deliberately deferred (see [ROADMAP](./05-ROADMAP.md)).

## 1. User stories

### Entry & rooms
- **US-1 [MUST]** As a host, I can create a room by typing any string so that I don't need to sign up.
- **US-2 [MUST]** As a joiner, I can enter an existing room by typing its exact name so that I land in the same space as my group.
- **US-3 [MUST]** As a joiner, I can open a shared link and go straight into the room so that joining is one click.
- **US-4 [MUST]** As any user, I set a display name and pick a color before/at entry so that others can tell who's who.
- **US-5 [SHOULD]** As a returning user, my last name+color are remembered so I don't retype them.

### Notes surface
- **US-6 [MUST]** As a writer, I can type rich text (headings, paragraphs, bold/italic, bullet & numbered lists, checkboxes, code blocks) so that notes are actually structured.
- **US-7 [MUST]** As a writer, I see other people's text edits appear live so that we co-write.
- **US-8 [MUST]** As a writer, I can paste/insert an image into the notes.
- **US-9 [SHOULD]** As a writer, I see other people's text cursors/selections with their name+color.

### Canvas surface
- **US-10 [MUST]** As a sketcher, I have Excalidraw's full toolset (freehand, rectangle, ellipse, arrow, line, text, select/move/resize, delete) so drawing feels complete.
- **US-11 [MUST]** As a sketcher, I see others' drawing changes live.
- **US-12 [MUST]** As a sketcher, I can add/paste an image onto the canvas.
- **US-13 [MUST]** As any user, I see other users' live cursors on the canvas with name+color.
- **US-14 [SHOULD]** As a sketcher, I can export the canvas as PNG and SVG.

### Presence, chat, navigation
- **US-15 [MUST]** As any user, I see a presence list of everyone currently in the room.
- **US-16 [MUST]** As any user, I can switch between the Notes and Canvas surfaces.
- **US-17 [SHOULD]** As a wide-screen user, I can view Notes and Canvas side-by-side (split view).
- **US-18 [MUST]** As any user, I can send/read text chat messages in the room.
- **US-19 [MUST]** As any user, I can copy the room's share link.

### Persistence
- **US-20 [MUST]** As any user, when I reopen a room later, all notes and drawings are exactly as last left.
- **US-21 [MUST]** As a user with a flaky connection, my offline edits reconcile without loss when I reconnect.

### The bridge (both-worlds)
- **US-22 [SHOULD]** As any user, I can drop an image that lives in both surfaces' vocabulary (paste works in each).
- **US-23 [LATER]** As a user, I can export a canvas selection directly into the notes as an embedded image.
- **US-24 [LATER]** As a user, I can reference a note block from the canvas (and vice-versa).

## 2. Functional requirements

### FR-A: Room lifecycle
- **FR-A1 [MUST]** A room is identified by a URL-safe slug derived from the typed string (e.g. `Algorithms Week 3` → `algorithms-week-3`). The raw display name is kept for showing in the UI.
- **FR-A2 [MUST]** Creating and joining are the same action: navigating to a room slug that doesn't exist creates it; one that exists joins it.
- **FR-A3 [MUST]** Rooms are **open**: anyone with the name/link joins. No passwords (MVP).
- **FR-A4 [MUST]** Slug collisions are *intentional sharing*, not an error (two people typing the same name = same room). This is documented UX, not a bug.
- **FR-A5 [SHOULD]** A landing page offers "Create a room" (with an optional name field + a "random name" generator) and "Join a room" (name field).

### FR-B: Identity
- **FR-B1 [MUST]** Identity = `{ id (random, per-session), displayName, color }`. No server-side account.
- **FR-B2 [MUST]** `id` is a stable random ID persisted in `localStorage` so a refresh keeps you as "the same" user within a room session.
- **FR-B3 [SHOULD]** `displayName` + `color` persist in `localStorage` across visits.
- **FR-B4 [MUST]** Color is auto-assigned (from a curated palette) but user-changeable.

### FR-C: Notes surface
- **FR-C1 [MUST]** Block-based rich text with at minimum: paragraph, H1–H3, bulleted list, numbered list, checklist, code block, image, divider.
- **FR-C2 [MUST]** Collaborative editing via the editor's Yjs binding; concurrent edits converge with no lost characters.
- **FR-C3 [SHOULD]** Remote text cursors + selection highlights rendered with each user's color/name.
- **FR-C4 [MUST]** Images are stored as blobs (see FR-F) and referenced by id, not inlined as giant base64 in the CRDT.

### FR-D: Canvas surface
- **FR-D1 [MUST]** Embed `@excalidraw/excalidraw`.
- **FR-D2 [MUST]** Excalidraw's element set is the source of truth for the canvas, mirrored into a Yjs shared type (see [LOGIC](./04-LOGIC.md)).
- **FR-D3 [MUST]** Remote element create/update/delete apply without clobbering the local user's in-progress action.
- **FR-D4 [MUST]** Remote cursors rendered via Excalidraw's collaborator API from Yjs **awareness**.
- **FR-D5 [SHOULD]** PNG + SVG export using Excalidraw's export utilities.
- **FR-D6 [MUST]** Canvas images stored as blobs (FR-F), referenced by Excalidraw `fileId`.

### FR-E: Presence, chat, awareness
- **FR-E1 [MUST]** Awareness carries `{ user: {id, name, color}, cursor, activeSurface, selection }` and is **not** persisted.
- **FR-E2 [MUST]** Presence list derives from the set of active awareness states; leaving (disconnect/timeout) removes you within a few seconds.
- **FR-E3 [MUST]** Chat is a Yjs shared array of `{ id, userId, name, color, text, ts }`, persisted with the doc.
- **FR-E4 [SHOULD]** Unread chat indicator when the chat panel is closed.

### FR-F: Media / images
- **FR-F1 [MUST]** Images are uploaded to blob storage; the CRDT stores only `{ fileId, url, mimeType, w, h }`.
- **FR-F2 [MUST]** Max image size enforced client-side (e.g. 5 MB) with a friendly error.
- **FR-F3 [SHOULD]** Client-side downscale of very large pasted images before upload.

### FR-G: Persistence & sync
- **FR-G1 [MUST]** The full room state = one Yjs document; the WebSocket server holds the authoritative in-memory copy while anyone is connected.
- **FR-G2 [MUST]** The server persists a snapshot of the Yjs doc to durable storage (debounced on change and on last-client-leave).
- **FR-G3 [MUST]** On first client connect to a cold room, the server loads the snapshot from storage.
- **FR-G4 [MUST]** Clients keep a local copy (IndexedDB) so reconnects are instant and offline edits survive (US-21).

## 3. Non-functional requirements

- **NFR-1 Cost [MUST]:** every component runs on a **free tier**; $0/month at target scale.
- **NFR-2 Latency [SHOULD]:** local edits feel instant (optimistic, no round-trip); remote edits appear in < ~300 ms on a normal connection.
- **NFR-3 Scale [MUST]:** correct and smooth with **2–10** concurrent editors per room; **not** required to handle 100.
- **NFR-4 Convergence [MUST]:** no matter the order/concurrency of edits, all clients end in an identical state (guaranteed by the CRDT — see [LOGIC](./04-LOGIC.md)).
- **NFR-5 Durability [MUST]:** a persisted room survives server restarts and cold starts.
- **NFR-6 Resilience [SHOULD]:** transient disconnects auto-reconnect and resync without user action or data loss.
- **NFR-7 Privacy [SHOULD]:** rooms are unlisted (no public directory); only people with the name/link can find them. (Not a security guarantee — see risks.)
- **NFR-8 Accessibility [SHOULD]:** keyboard-navigable entry flow; sufficient color contrast; respects reduced-motion.
- **NFR-9 Browser support [MUST]:** current Chrome, Edge, Firefox, Safari (desktop). Mobile = best-effort responsive.

## 4. MVP scope — the line in the sand

### In the MVP box ✅
Room create/join by name + link · anonymous name+color identity · **Notes** surface (collab rich text) · **Canvas** surface (collab Excalidraw) · surface switching · live cursors (both surfaces) · presence list · text chat · image paste/attach (both surfaces) · PNG/SVG export · persistence + offline reconcile · $0 hosting.

### Out of the MVP box ❌ (→ [ROADMAP](./05-ROADMAP.md))
Accounts/permissions · passwords/locked rooms · voice/video · version history/time-travel · canvas-selection-into-notes bridge (US-23) · cross-surface references (US-24) · comments/reactions · templates · mobile-native · presence "follow" mode.

## 5. Acceptance tests (how we verify MVP is done)

1. **Two-browser convergence:** open the same room in two browsers; type in Notes and draw on Canvas simultaneously from both; after activity settles, both show identical content.
2. **Concurrent same-target:** both users edit the *same* paragraph and drag the *same* rectangle at once → no crash, no lost edits, both converge.
3. **Cursor visibility:** each browser sees the other's cursor with correct name+color on both surfaces.
4. **Persistence:** close both browsers, wait past server idle timeout, reopen → content intact.
5. **Offline reconcile:** disconnect one browser, edit in both, reconnect → edits merge, nothing lost.
6. **Cold-start join:** brand-new room name → room is created and usable; share link opens the same room in another browser.
7. **Media:** paste an image into Notes and onto Canvas; both persist and reload correctly; CRDT payload stays small (image is a reference, not base64).
8. **Export:** canvas exports to a valid PNG and SVG.
9. **Cost:** deployed stack incurs $0 charges for a week of small-group use.

## 6. Key risks & how the spec handles them

| Risk | Mitigation in spec |
|------|--------------------|
| Free WS host cold-starts / sleeps | Client keeps IndexedDB copy (FR-G4); persistence on storage (FR-G2/3); UX shows "reconnecting" state (NFR-6). |
| Excalidraw ↔ Yjs binding is the hard, custom part | Isolated in LOGIC doc; element-diff strategy specified (FR-D2/3); guarded against clobbering in-progress edits. |
| Images bloating the CRDT | Blob storage + references only (FR-F1, FR-C4, FR-D6). |
| Open rooms → spam/squatting | Accepted for MVP (trusted small groups); NFR-7 unlisted; passwords are [LATER]. |
| "Both worlds" scope creep | Bridge features explicitly [LATER] (US-23/24); MVP ships two clean surfaces + image paste only. |

---

Next: [02 — DESIGN](./02-DESIGN.md), where these requirements become screens and flows.
