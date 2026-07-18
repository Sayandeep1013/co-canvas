import * as Y from "yjs";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { YJS_LOCAL_ORIGIN } from "./constants";

const JSON_FIELDS = new Set([
  "points",
  "groupIds",
  "boundElements",
  "customData",
  "frameId",
  "index",
  "crop",
  "link",
]);

function writeElementToYMap(ymap: Y.Map<unknown>, el: ExcalidrawElement) {
  for (const [key, value] of Object.entries(el)) {
    if (value === undefined) continue;
    if (
      JSON_FIELDS.has(key) ||
      Array.isArray(value) ||
      (typeof value === "object" && value !== null)
    ) {
      ymap.set(key, JSON.stringify(value));
    } else {
      ymap.set(key, value);
    }
  }
}

function readElementFromYMap(ymap: Y.Map<unknown>): ExcalidrawElement | null {
  const obj: Record<string, unknown> = {};
  ymap.forEach((value, key) => {
    if (JSON_FIELDS.has(key) && typeof value === "string") {
      try {
        obj[key] = JSON.parse(value);
      } catch {
        obj[key] = value;
      }
    } else if (
      typeof value === "string" &&
      (value.startsWith("[") || value.startsWith("{"))
    ) {
      try {
        obj[key] = JSON.parse(value);
      } catch {
        obj[key] = value;
      }
    } else {
      obj[key] = value;
    }
  });
  if (!obj.id || !obj.type) return null;
  return obj as ExcalidrawElement;
}

function pickWinner(
  local: ExcalidrawElement,
  remote: ExcalidrawElement,
): ExcalidrawElement {
  if (remote.version > local.version) return remote;
  if (remote.version < local.version) return local;
  return remote.versionNonce >= local.versionNonce ? remote : local;
}

function reconcileElements(
  local: readonly ExcalidrawElement[],
  remoteById: Map<string, ExcalidrawElement>,
  skipId: string | null,
): ExcalidrawElement[] {
  const merged = new Map<string, ExcalidrawElement>();

  for (const el of local) {
    if (el.isDeleted && !remoteById.has(el.id)) continue;
    merged.set(el.id, el);
  }

  for (const [id, remote] of remoteById) {
    if (id === skipId) continue;
    const localEl = merged.get(id);
    if (!localEl) {
      merged.set(id, remote);
      continue;
    }
    merged.set(id, pickWinner(localEl, remote));
  }

  return Array.from(merged.values());
}

export interface ExcalidrawBindingOptions {
  getEditingElementId?: () => string | null;
  /** Called after each remote apply with whether the scene has visible content. */
  onApply?: (hasContent: boolean) => void;
}

/** Read all current canvas elements out of the Yjs doc (for initial mount). */
export function readCanvasElements(doc: Y.Doc): ExcalidrawElement[] {
  const canvasMap = doc.getMap<Y.Map<unknown>>("canvas");
  const els: ExcalidrawElement[] = [];
  canvasMap.forEach((yEl) => {
    const el = readElementFromYMap(yEl);
    if (el) els.push(el);
  });
  return els;
}

export interface ExcalidrawBinding {
  /** Pass to Excalidraw's `onChange` prop. */
  onChange: (elements: readonly ExcalidrawElement[]) => void;
  /** Call once when the API ref is ready. */
  hydrate: () => void;
  destroy: () => void;
}

/** Bind Excalidraw ↔ Yjs per docs/04-LOGIC.md §7. */
export function createExcalidrawBinding(
  doc: Y.Doc,
  getApi: () => ExcalidrawImperativeAPI | null,
  options: ExcalidrawBindingOptions = {},
): ExcalidrawBinding {
  const canvasMap = doc.getMap<Y.Map<unknown>>("canvas");
  const lastSeenVersion = new Map<string, number>();
  let applyingRemote = false;
  let rafId: number | null = null;
  let pendingElements: readonly ExcalidrawElement[] | null = null;

  const flushOutgoing = () => {
    rafId = null;
    if (!pendingElements || applyingRemote) return;
    const elements = pendingElements;
    pendingElements = null;

    doc.transact(() => {
      for (const el of elements) {
        const prev = lastSeenVersion.get(el.id);
        if (prev !== undefined && el.version <= prev) continue;

        let yEl = canvasMap.get(el.id);
        if (!yEl) {
          yEl = new Y.Map<unknown>();
          canvasMap.set(el.id, yEl);
        }
        writeElementToYMap(yEl, el);
        lastSeenVersion.set(el.id, el.version);
      }
    }, YJS_LOCAL_ORIGIN);
  };

  const applyRemote = () => {
    const api = getApi();
    if (!api || applyingRemote) return;

    const skipId = options.getEditingElementId?.() ?? null;
    const remoteById = new Map<string, ExcalidrawElement>();

    canvasMap.forEach((yEl, id) => {
      const el = readElementFromYMap(yEl);
      if (el) remoteById.set(id, el);
    });

    const local = api.getSceneElements();
    const merged = reconcileElements(local, remoteById, skipId);

    applyingRemote = true;
    try {
      api.updateScene({ elements: merged });
      for (const el of merged) {
        lastSeenVersion.set(el.id, el.version);
      }
    } finally {
      applyingRemote = false;
    }
    options.onApply?.(merged.some((e) => !e.isDeleted));
  };

  const onChange = (elements: readonly ExcalidrawElement[]) => {
    if (applyingRemote) return;
    pendingElements = elements;
    if (rafId === null) {
      rafId = requestAnimationFrame(flushOutgoing);
    }
  };

  const observer = (_events: Y.YEvent<Y.AbstractType<unknown>>[], transaction: Y.Transaction) => {
    if (transaction.origin === YJS_LOCAL_ORIGIN) return;
    applyRemote();
  };

  canvasMap.observeDeep(observer);

  return {
    onChange,
    hydrate: applyRemote,
    destroy: () => {
      canvasMap.unobserveDeep(observer);
      if (rafId !== null) cancelAnimationFrame(rafId);
    },
  };
}
