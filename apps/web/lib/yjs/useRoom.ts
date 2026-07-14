"use client";

import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";
import type { Awareness } from "y-protocols/awareness";
import { AwarenessState, Identity, SurfaceId } from "@canvas/shared";

/** Where the sync server lives. Overridable per-environment. */
const SYNC_URL =
  process.env.NEXT_PUBLIC_SYNC_URL?.replace(/\/$/, "") || "ws://localhost:1234";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface RoomHandle {
  /** The single Yjs document for this room (holds notes, canvas, chat, meta). */
  doc: Y.Doc;
  /** The awareness instance — ephemeral cursors/presence (docs/04-LOGIC.md §5). */
  awareness: Awareness | null;
  /** WebSocket connection status, surfaced honestly in the UI. */
  status: ConnectionStatus;
  /** Whether the local IndexedDB copy has finished loading (instant reloads). */
  synced: boolean;
  /** Everyone currently present (including you), derived from awareness. */
  peers: Identity[];
}

/**
 * Creates and manages the Yjs pipeline for one room:
 *   - a Y.Doc (the shared truth),
 *   - an IndexedDB provider (local durability + offline),
 *   - a WebSocket provider (peer sync + awareness).
 *
 * This is the Phase 0 core: if this works across two tabs, the architecture
 * is validated. See docs/05-ROADMAP.md Phase 0.
 */
export function useRoom(roomSlug: string, identity: Identity): RoomHandle {
  // The doc is created once and lives for the component's lifetime.
  const doc = useMemo(() => new Y.Doc(), [roomSlug]);

  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [synced, setSynced] = useState(false);
  const [peers, setPeers] = useState<Identity[]>([]);
  const [awareness, setAwareness] = useState<Awareness | null>(null);

  useEffect(() => {
    const idb = new IndexeddbPersistence(`canvas-room-${roomSlug}`, doc);
    idb.on("synced", () => setSynced(true));

    const ws = new WebsocketProvider(SYNC_URL, roomSlug, doc);
    setAwareness(ws.awareness);

    // Publish who we are (ephemeral — not saved to the doc).
    const initial: Partial<AwarenessState> = {
      user: identity,
      cursor: null,
      activeSurface: "notes" as SurfaceId,
    };
    ws.awareness.setLocalStateField("user", initial.user);
    ws.awareness.setLocalStateField("cursor", initial.cursor);
    ws.awareness.setLocalStateField("activeSurface", initial.activeSurface);

    const onStatus = (e: { status: ConnectionStatus }) => setStatus(e.status);
    ws.on("status", onStatus);

    const onAwareness = () => {
      const states = Array.from(ws.awareness.getStates().values());
      const users = states
        .map((s) => (s as Partial<AwarenessState>).user)
        .filter((u): u is Identity => Boolean(u && u.id));
      // De-dupe by id (a user may briefly appear twice across reconnects).
      const byId = new Map(users.map((u) => [u.id, u]));
      setPeers(Array.from(byId.values()));
    };
    ws.awareness.on("change", onAwareness);
    onAwareness();

    return () => {
      ws.awareness.off("change", onAwareness);
      ws.off("status", onStatus);
      ws.destroy();
      idb.destroy();
      setAwareness(null);
    };
    // identity is stable for the session; re-run only if the room changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomSlug, doc]);

  return { doc, awareness, status, synced, peers };
}
