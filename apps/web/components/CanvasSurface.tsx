"use client";

import "@excalidraw/excalidraw/index.css";
import "@/styles/canvas-surfaces.css";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MousePointer2, Pencil, Sparkles } from "lucide-react";
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
import { useTheme } from "@/lib/theme";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-canvas-muted">
        Loading canvas…
      </div>
    ),
  },
);

const CANVAS_UI = {
  canvasActions: {
    changeViewBackgroundColor: false,
    clearCanvas: true,
    export: { saveFileToDisk: true },
    loadScene: false,
    saveToActiveFile: false,
    toggleTheme: false,
  },
  tools: { image: true },
} as const;

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
  const theme = useTheme();
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const bindingRef = useRef<ReturnType<typeof createExcalidrawBinding> | null>(
    null,
  );
  const editingIdRef = useRef<string | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const initialData = useMemo(
    () => ({
      appState: {
        viewBackgroundColor: "transparent",
        // Clean, design-tool defaults — drop Excalidraw's sketchy signature.
        currentItemStrokeColor: "#1c1917",
        currentItemBackgroundColor: "transparent",
        currentItemRoughness: 0, // crisp lines, not hand-drawn
        currentItemRoundness: "sharp" as const, // precise corners
        currentItemStrokeWidth: 1,
        currentItemFontFamily: 2, // clean sans, not the Virgil hand-drawn font
        gridSize: undefined,
      },
    }),
    [],
  );

  const onApiReady = useCallback((api: ExcalidrawImperativeAPI) => {
    apiRef.current = api;
    setApiReady(true);
    const els = api.getSceneElements();
    setIsEmpty(!els.some((e) => !e.isDeleted));
  }, []);

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
    (
      elements: readonly ExcalidrawElement[],
      appState: { selectedElementIds?: Record<string, boolean> },
    ) => {
      bindingRef.current?.onChange(elements);
      setIsEmpty(!elements.some((e) => !e.isDeleted));
      const selected = Object.keys(appState.selectedElementIds ?? {}).filter(
        (id) => appState.selectedElementIds?.[id],
      );
      editingIdRef.current = selected.length === 1 ? selected[0] : null;
    },
    [],
  );

  useEffect(() => {
    if (!apiRef.current) return;

    const updateCollaborators = () => {
      const api = apiRef.current;
      if (!api) return;

      const collaborators = new Map<SocketId, Collaborator>();

      peers.forEach(({ state }) => {
        const user = (state as Partial<AwarenessState>).identity;
        const cursor = (state as Partial<AwarenessState>).canvasCursor;
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
    (payload: { pointer: { x: number; y: number } }) => {
      awareness.setLocalStateField("canvasCursor", {
        surface: "canvas",
        x: payload.pointer.x,
        y: payload.pointer.y,
      });
    },
    [awareness],
  );

  return (
    <div
      className={
        visible
          ? "canvas-workspace relative h-full min-h-0 flex-1"
          : "hidden"
      }
      onPointerEnter={onActive}
    >
      {isEmpty && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-12"
          aria-hidden
        >
          <div className="max-w-sm rounded-2xl border border-canvas-border bg-canvas-surface/90 px-8 py-10 text-center shadow-canvas-md backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-canvas-accent-soft">
              <Sparkles className="h-6 w-6 text-canvas-accent" />
            </div>
            <p className="text-lg font-semibold text-canvas-ink">
              A clean slate
            </p>
            <p className="mt-2 text-sm text-canvas-muted">
              Pick a tool and start designing — shapes, arrows, text, freehand.
              Everyone in the room sees it appear live.
            </p>
            <div className="mt-6 flex justify-center gap-6 text-xs text-canvas-muted">
              <span className="inline-flex items-center gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Draw
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MousePointer2 className="h-3.5 w-3.5" />
                Select
              </span>
            </div>
          </div>
        </div>
      )}

      <Excalidraw
        excalidrawAPI={onApiReady}
        initialData={initialData}
        theme={theme}
        isCollaborating
        onChange={onChange}
        onPointerUpdate={onPointerUpdate}
        UIOptions={CANVAS_UI}
      />
    </div>
  );
}
