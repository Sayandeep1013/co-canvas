"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import { Identity } from "@canvas/shared";
import { useMemo } from "react";

interface NotesSurfaceProps {
  doc: Y.Doc;
  provider: WebsocketProvider;
  identity: Identity;
  visible: boolean;
}

/** Collaborative rich-text editor bound to `doc.getXmlFragment("notes")`. */
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

  return (
    <div className={visible ? "flex h-full min-h-0 flex-1 flex-col" : "hidden"}>
      <BlockNoteView editor={editor} className="flex-1 overflow-auto" />
    </div>
  );
}
