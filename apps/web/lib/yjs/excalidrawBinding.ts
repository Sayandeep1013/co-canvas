import * as Y from "yjs";
import type {
  BinaryFileData,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
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

/**
 * Read all synced image/binary files (for initial mount). Excalidraw stores
 * image data separately from elements, keyed by fileId — without syncing these,
 * remote peers only see an empty placeholder.
 */
export function readCanvasFiles(doc: Y.Doc): BinaryFiles {
  const filesMap = doc.getMap<BinaryFileData>("files");
  const files: BinaryFiles = {};
  filesMap.forEach((file, id) => {
    files[id] = file;
  });
  return files;
}

export interface ExcalidrawBinding {
  /** Pass to Excalidraw's `onChange` prop (elements + binary files). */
  onChange: (
    elements: readonly ExcalidrawElement[],
    files?: BinaryFiles,
  ) => void;
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
  const filesMap = doc.getMap<BinaryFileData>("files");
  const lastSeenVersion = new Map<string, number>();
  const sentFiles = new Set<string>();
  let applyingRemote = false;
  let rafId: number | null = null;
  let pendingElements: readonly ExcalidrawElement[] | null = null;
  let pendingFiles: BinaryFiles | null = null;

  const flushOutgoing = () => {
    rafId = null;
    if (applyingRemote) return;
    const elements = pendingElements;
    const files = pendingFiles;
    pendingElements = null;
    pendingFiles = null;
    if (!elements && !files) return;

    doc.transact(() => {
      for (const el of elements ?? []) {
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
      // Publish any image/binary files we haven't sent yet.
      if (files) {
        for (const [id, file] of Object.entries(files)) {
          if (sentFiles.has(id) || filesMap.has(id)) {
            sentFiles.add(id);
            continue;
          }
          filesMap.set(id, file);
          sentFiles.add(id);
        }
      }
    }, YJS_LOCAL_ORIGIN);
  };

  const applyRemoteFiles = (api: ExcalidrawImperativeAPI) => {
    const existing = api.getFiles();
    const toAdd: BinaryFileData[] = [];
    filesMap.forEach((file, id) => {
      sentFiles.add(id);
      if (!existing[id]) toAdd.push(file);
    });
    if (toAdd.length) api.addFiles(toAdd);
  };

  const applyRemote = () => {
    const api = getApi();
    if (!api || applyingRemote) return;

    // Add image data first so image elements render instead of a placeholder.
    applyRemoteFiles(api);

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
      // captureUpdate "NEVER" keeps remote/peer changes OUT of this client's
      // local undo stack — so Ctrl+Z only reverts YOUR actions one by one and
      // never wipes a collaborator's work (or resets to a clean slate).
      api.updateScene({ elements: merged, captureUpdate: "NEVER" });
      for (const el of merged) {
        lastSeenVersion.set(el.id, el.version);
      }
    } finally {
      applyingRemote = false;
    }
    options.onApply?.(merged.some((e) => !e.isDeleted));
  };

  const onChange = (
    elements: readonly ExcalidrawElement[],
    files?: BinaryFiles,
  ) => {
    if (applyingRemote) return;
    pendingElements = elements;
    if (files) pendingFiles = files;
    if (rafId === null) {
      rafId = requestAnimationFrame(flushOutgoing);
    }
  };

  const observer = (_events: Y.YEvent<Y.AbstractType<unknown>>[], transaction: Y.Transaction) => {
    if (transaction.origin === YJS_LOCAL_ORIGIN) return;
    applyRemote();
  };
  const filesObserver = (
    _event: Y.YMapEvent<BinaryFileData>,
    transaction: Y.Transaction,
  ) => {
    if (transaction.origin === YJS_LOCAL_ORIGIN) return;
    applyRemote();
  };

  canvasMap.observeDeep(observer);
  filesMap.observe(filesObserver);

  return {
    onChange,
    hydrate: applyRemote,
    destroy: () => {
      canvasMap.unobserveDeep(observer);
      filesMap.unobserve(filesObserver);
      if (rafId !== null) cancelAnimationFrame(rafId);
    },
  };
}
