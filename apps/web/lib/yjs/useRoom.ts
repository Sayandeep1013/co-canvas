"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";
import type { Awareness } from "y-protocols/awareness";
import { AwarenessState, Identity, SurfaceId } from "@canvas/shared";
import { SYNC_URL } from "./constants";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

/** One peer's live awareness state (ephemeral). */
export interface PeerState {
  clientId: number;
  state: Partial<AwarenessState>;
}

export interface RoomHandle {
  doc: Y.Doc;
  awareness: Awareness | null;
  /** WebSocket provider — BlockNote binds to this for collaboration. */
  provider: WebsocketProvider | null;
  status: ConnectionStatus;
  synced: boolean;
  peers: PeerState[];
  updateAwareness: (patch: Partial<AwarenessState>) => void;
}

export function useRoom(roomSlug: string, identity: Identity): RoomHandle {
  const doc = useMemo(() => new Y.Doc(), [roomSlug]);

  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [synced, setSynced] = useState(false);
  const [peers, setPeers] = useState<PeerState[]>([]);
  const [awareness, setAwareness] = useState<Awareness | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  useEffect(() => {
    const idb = new IndexeddbPersistence(`canvas-room-${roomSlug}`, doc);
    idb.on("synced", () => setSynced(true));

    const ws = new WebsocketProvider(SYNC_URL, roomSlug, doc);
    setAwareness(ws.awareness);
    setProvider(ws);

    ws.awareness.setLocalStateField("user", identity);
    ws.awareness.setLocalStateField("cursor", null);
    ws.awareness.setLocalStateField("activeSurface", "notes" satisfies SurfaceId);

    const onStatus = (e: { status: ConnectionStatus }) => setStatus(e.status);
    ws.on("status", onStatus);

    const onAwareness = () => {
      const entries: PeerState[] = [];
      ws.awareness.getStates().forEach((state, clientId) => {
        entries.push({ clientId, state: state as Partial<AwarenessState> });
      });
      setPeers(entries);
    };
    ws.awareness.on("change", onAwareness);
    onAwareness();

    return () => {
      ws.awareness.off("change", onAwareness);
      ws.off("status", onStatus);
      ws.destroy();
      idb.destroy();
      setAwareness(null);
      setProvider(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomSlug, doc]);

  const updateAwareness = useCallback(
    (patch: Partial<AwarenessState>) => {
      if (!awareness) return;
      if (patch.user !== undefined) awareness.setLocalStateField("user", patch.user);
      if (patch.cursor !== undefined) awareness.setLocalStateField("cursor", patch.cursor);
      if (patch.activeSurface !== undefined) {
        awareness.setLocalStateField("activeSurface", patch.activeSurface);
      }
    },
    [awareness],
  );

  // Keep awareness user in sync when identity changes (name/color edit).
  useEffect(() => {
    updateAwareness({ user: identity });
  }, [identity, updateAwareness]);

  return { doc, awareness, provider, status, synced, peers, updateAwareness };
}
