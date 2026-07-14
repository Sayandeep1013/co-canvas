"use client";

import "@excalidraw/excalidraw/index.css";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";
import type {
  Collaborator,
  ExcalidrawImperativeAPI,
  SocketId,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { AwarenessState, Identity } from "@canvas/shared";
import { createExcalidrawBinding } from "@/lib/yjs/excalidrawBinding";
import type { PeerState } from "@/lib/yjs/useRoom";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false, loading: () => <div className="p-8 text-neutral-400">Loading canvas…</div> },
);

interface CanvasSurfaceProps {
  doc: Y.Doc;
  awareness: Awareness;
  identity: Identity;
  peers: PeerState[];
  visible: boolean;
  onActive: () => void;
}

export default function CanvasSurface({
  doc,
  awareness,
  identity,
  peers,
  visible,
  onActive,
}: CanvasSurfaceProps) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const bindingRef = useRef<ReturnType<typeof createExcalidrawBinding> | null>(null);
  const editingIdRef = useRef<string | null>(null);
  const [apiReady, setApiReady] = useState(false);

  const onApiReady = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      apiRef.current = api;
      setApiReady(true);
    },
    [],
  );

  useEffect(() => {
    if (!apiReady || !apiRef.current) return;

    bindingRef.current?.destroy();
    const binding = createExcalidrawBinding(
      doc,
      () => apiRef.current,
      { getEditingElementId: () => editingIdRef.current },
    );
    bindingRef.current = binding;
    binding.hydrate();

    return () => binding.destroy();
  }, [doc, apiReady]);

  const onChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: { selectedElementIds?: Record<string, boolean> }) => {
      bindingRef.current?.onChange(elements);
      const selected = Object.keys(appState.selectedElementIds ?? {}).filter(
        (id) => appState.selectedElementIds?.[id],
      );
      editingIdRef.current = selected.length === 1 ? selected[0] : null;
    },
    [],
  );

  // Remote collaborator cursors (docs/04-LOGIC.md §7.5 + §8).
  useEffect(() => {
    if (!apiRef.current) return;

    const updateCollaborators = () => {
      const api = apiRef.current;
      if (!api) return;

      const collaborators = new Map<SocketId, Collaborator>();

      peers.forEach(({ state }) => {
        const user = state.user as Identity | undefined;
        const cursor = (state as Partial<AwarenessState>).cursor;
        if (!user || user.id === identity.id) return;
        if (!cursor || cursor.surface !== "canvas") return;

        collaborators.set(user.id as SocketId, {
          username: user.displayName,
          color: { background: user.color, stroke: user.color },
          pointer: { x: cursor.x, y: cursor.y, tool: "pointer" },
        });
      });

      api.updateScene({ collaborators });
    };

    updateCollaborators();
  }, [peers, identity.id]);

  const onPointerUpdate = useCallback(
    (payload: {
      pointer: { x: number; y: number };
    }) => {
      awareness.setLocalStateField("cursor", {
        surface: "canvas",
        x: payload.pointer.x,
        y: payload.pointer.y,
      });
    },
    [awareness],
  );

  return (
    <div
      className={visible ? "relative h-full min-h-0 flex-1" : "hidden"}
      onPointerEnter={onActive}
    >
      <Excalidraw
        excalidrawAPI={onApiReady}
        onChange={onChange}
        onPointerUpdate={onPointerUpdate}
        UIOptions={{
          canvasActions: {
            export: { saveFileToDisk: true },
          },
        }}
      />
    </div>
  );
}
