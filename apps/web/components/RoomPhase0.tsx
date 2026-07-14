"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type * as Y from "yjs";
import { getOrCreateIdentity, saveIdentity } from "@/lib/identity";
import { useRoom, type ConnectionStatus } from "@/lib/yjs/useRoom";
import { Identity } from "@canvas/shared";

/**
 * PHASE 0 verification surface (docs/05-ROADMAP.md Phase 0).
 *
 * Not the real UI — this is the smallest thing that proves the whole pipeline:
 * a shared text box synced via Yjs across tabs, plus live connection status and
 * presence. Once this works across two browsers (and survives refresh +
 * server restart), the architecture is validated and we build the real room.
 */
export default function RoomPhase0({ slug }: { slug: string }) {
  // Identity is browser-only; create it after mount to avoid SSR mismatch.
  const [identity, setIdentity] = useState<Identity | null>(null);
  useEffect(() => setIdentity(getOrCreateIdentity()), []);

  if (!identity) {
    return (
      <div className="flex flex-1 items-center justify-center text-neutral-400">
        loading…
      </div>
    );
  }
  return <RoomInner slug={slug} identity={identity} onIdentity={setIdentity} />;
}

function RoomInner({
  slug,
  identity,
  onIdentity,
}: {
  slug: string;
  identity: Identity;
  onIdentity: (i: Identity) => void;
}) {
  const { doc, awareness, status, synced, peers } = useRoom(slug, identity);

  // Push name/color changes into awareness so peers see them live.
  useEffect(() => {
    awareness?.setLocalStateField("user", identity);
  }, [awareness, identity]);

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        slug={slug}
        status={status}
        synced={synced}
        peerCount={peers.length}
      />
      <div className="flex flex-1 flex-col gap-6 p-6 lg:flex-row">
        <section className="flex flex-1 flex-col">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Shared scratch text (Phase 0 sync test)
          </h2>
          <SharedTextArea doc={doc} />
          <p className="mt-2 text-xs text-neutral-400">
            Open this same URL in another tab or browser. Typing here should
            appear there instantly. Refresh — it persists. Restart the sync
            server — it reconnects.
          </p>
        </section>
        <aside className="w-full lg:w-72">
          <PresencePanel peers={peers} meId={identity.id} />
          <IdentityEditor identity={identity} onIdentity={onIdentity} />
        </aside>
      </div>
    </div>
  );
}

function TopBar({
  slug,
  status,
  synced,
  peerCount,
}: {
  slug: string;
  status: ConnectionStatus;
  synced: boolean;
  peerCount: number;
}) {
  const dot =
    status === "connected"
      ? "bg-green-500"
      : status === "connecting"
        ? "bg-amber-500"
        : "bg-red-500";
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-bold">
          Can<span className="text-blue-600">V</span>as
        </Link>
        <span className="text-neutral-300">·</span>
        <span className="font-mono text-sm text-neutral-600 dark:text-neutral-300">
          {slug}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-neutral-500">
        <span className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
          {status}
        </span>
        <span>{peerCount} online</span>
        <span>{synced ? "✓ local cache" : "loading cache…"}</span>
      </div>
    </header>
  );
}

/**
 * Binds a plain <textarea> to a Y.Text via a minimal prefix/suffix diff so that
 * concurrent typing from two people merges instead of clobbering. This is a
 * throwaway Phase 0 binding — the real Notes surface (Phase 2) uses BlockNote.
 */
function SharedTextArea({ doc }: { doc: Y.Doc }) {
  const ytext = useMemo(() => doc.getText("phase0-scratch"), [doc]);
  const [value, setValue] = useState(ytext.toString());

  useEffect(() => {
    const update = () => setValue(ytext.toString());
    ytext.observe(update);
    update();
    return () => ytext.unobserve(update);
  }, [ytext]);

  const onChange = (next: string) => {
    const prev = ytext.toString();
    if (prev === next) return;
    // common prefix
    let start = 0;
    const min = Math.min(prev.length, next.length);
    while (start < min && prev[start] === next[start]) start++;
    // common suffix
    let ep = prev.length;
    let en = next.length;
    while (ep > start && en > start && prev[ep - 1] === next[en - 1]) {
      ep--;
      en--;
    }
    doc.transact(() => {
      if (ep > start) ytext.delete(start, ep - start);
      if (en > start) ytext.insert(start, next.slice(start, en));
    });
  };

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type here and watch it sync…"
      className="min-h-64 flex-1 resize-none rounded-xl border border-neutral-300 bg-white p-4 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-neutral-700 dark:bg-neutral-950"
    />
  );
}

function PresencePanel({ peers, meId }: { peers: Identity[]; meId: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        In this room
      </h3>
      <ul className="space-y-2">
        {peers.length === 0 && (
          <li className="text-sm text-neutral-400">just you (connecting…)</li>
        )}
        {peers.map((p) => (
          <li key={p.id} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span>{p.displayName}</span>
            {p.id === meId && (
              <span className="text-xs text-neutral-400">(you)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function IdentityEditor({
  identity,
  onIdentity,
}: {
  identity: Identity;
  onIdentity: (i: Identity) => void;
}) {
  return (
    <div className="mt-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Your name
      </label>
      <input
        value={identity.displayName}
        onChange={(e) => {
          const next = { ...identity, displayName: e.target.value };
          saveIdentity(next);
          onIdentity(next);
        }}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
      />
    </div>
  );
}
