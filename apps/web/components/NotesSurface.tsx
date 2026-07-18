"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "@/styles/canvas-surfaces.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { PenLine } from "lucide-react";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import { Identity } from "@canvas/shared";
import { useEffect, useMemo } from "react";

interface NotesSurfaceProps {
  doc: Y.Doc;
  provider: WebsocketProvider;
  identity: Identity;
  visible: boolean;
}

export default function NotesSurface({
  doc,
  provider,
  identity,
  visible,
}: NotesSurfaceProps) {
  const fragment = useMemo(() => doc.getXmlFragment("notes"), [doc]);

  const editor = useCreateBlockNote(
    {
      collaboration: {
        fragment,
        provider: { awareness: provider.awareness },
        user: {
          name: identity.displayName,
          color: identity.color,
        },
        showCursorLabels: "activity",
      },
    },
    [fragment, provider, identity.displayName, identity.color],
  );

  // Drop the cursor straight into the editor when Notes is the active surface,
  // so you can just start typing (dontpad-style).
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      try {
        editor.focus();
      } catch {
        /* editor not mounted yet — ignore */
      }
    }, 50);
    return () => clearTimeout(t);
  }, [visible, editor]);

  return (
    <div
      className={
        visible ? "notes-workspace flex h-full min-h-0 flex-1 flex-col" : "hidden"
      }
    >
      <div className="mb-3 flex shrink-0 items-center gap-2 px-1 text-xs font-medium text-canvas-muted">
        <PenLine className="h-3.5 w-3.5" aria-hidden />
        Shared notes · type <kbd className="rounded bg-canvas-bg-subtle px-1.5 py-0.5 font-mono">/</kbd> for blocks
      </div>
      <BlockNoteView editor={editor} className="min-h-0 flex-1 overflow-auto" />
    </div>
  );
}
