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

    // Our presence lives on `identity` / `canvasCursor` — NOT `user` / `cursor`,
    // which BlockNote's collaboration plugin owns (see AwarenessState note).
    ws.awareness.setLocalStateField("identity", identity);
    ws.awareness.setLocalStateField("canvasCursor", null);
    ws.awareness.setLocalStateField("activeSurface", "notes" satisfies SurfaceId);

    const onStatus = (e: { status: ConnectionStatus }) => setStatus(e.status);
    ws.on("status", onStatus);

    const readPeers = () => {
      const entries: PeerState[] = [];
      ws.awareness.getStates().forEach((state, clientId) => {
        entries.push({ clientId, state: state as Partial<AwarenessState> });
      });
      setPeers(entries);
    };

    // Awareness can change *during* another component's render (BlockNote sets
    // its awareness field while rendering). Updating React state synchronously
    // then throws "setState while rendering". Defer to the next frame so the
    // update always lands outside any render pass.
    let rafId: number | null = null;
    const onAwareness = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        readPeers();
      });
    };
    ws.awareness.on("change", onAwareness);
    readPeers();

    // Remove ourselves from presence immediately on tab/window close so peers
    // don't keep showing a ghost. (Yjs also drops us on socket close, but this
    // is instant and covers hard closes.)
    const onUnload = () => {
      ws.awareness.setLocalState(null);
    };
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
      ws.awareness.off("change", onAwareness);
      ws.off("status", onStatus);
      ws.awareness.setLocalState(null);
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
      if (patch.identity !== undefined) {
        awareness.setLocalStateField("identity", patch.identity);
      }
      if (patch.canvasCursor !== undefined) {
        awareness.setLocalStateField("canvasCursor", patch.canvasCursor);
      }
      if (patch.activeSurface !== undefined) {
        awareness.setLocalStateField("activeSurface", patch.activeSurface);
      }
    },
    [awareness],
  );

  // Keep presence identity in sync when name/color changes.
  useEffect(() => {
    updateAwareness({ identity });
  }, [identity, updateAwareness]);

  return { doc, awareness, provider, status, synced, peers, updateAwareness };
}
