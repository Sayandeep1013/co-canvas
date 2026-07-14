"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Identity, SurfaceId } from "@canvas/shared";
import {
  getOrCreateIdentity,
  hasCompletedIdentitySetup,
  saveIdentity,
} from "@/lib/identity";
import { useRoom, type ConnectionStatus } from "@/lib/yjs/useRoom";
import IdentityPrompt from "@/components/IdentityPrompt";
import PresenceRail from "@/components/PresenceRail";
import NotesSurface from "@/components/NotesSurface";
import CanvasSurface from "@/components/CanvasSurface";

interface RoomProps {
  slug: string;
}

export default function Room({ slug }: RoomProps) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = getOrCreateIdentity();
    setIdentity(id);
    setNeedsSetup(!hasCompletedIdentitySetup() || !id.displayName.trim());
    setMounted(true);
  }, []);

  if (!mounted || !identity) {
    return (
      <div className="flex flex-1 items-center justify-center text-neutral-400">
        Loading…
      </div>
    );
  }

  if (needsSetup) {
    return (
      <IdentityPrompt
        roomSlug={slug}
        identity={identity}
        onComplete={(next) => {
          setIdentity(next);
          setNeedsSetup(false);
        }}
      />
    );
  }

  return (
    <RoomConnected slug={slug} identity={identity} onIdentity={setIdentity} />
  );
}

function RoomConnected({
  slug,
  identity,
  onIdentity,
}: {
  slug: string;
  identity: Identity;
  onIdentity: (i: Identity) => void;
}) {
  const { doc, awareness, provider, status, synced, peers, updateAwareness } =
    useRoom(slug, identity);
  const [surface, setSurface] = useState<SurfaceId>("notes");

  useEffect(() => {
    updateAwareness({ activeSurface: surface, cursor: null });
  }, [surface, updateAwareness]);

  const setSurfaceAndNotify = (s: SurfaceId) => {
    setSurface(s);
    updateAwareness({ activeSurface: s, cursor: null });
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-bold">
            Can<span className="text-blue-600">V</span>as
          </Link>
          <span className="text-neutral-300">·</span>
          <span className="font-mono text-sm text-neutral-600 dark:text-neutral-300">
            {slug}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-neutral-200 p-1 dark:border-neutral-700">
          <SurfaceTab
            active={surface === "notes"}
            onClick={() => setSurfaceAndNotify("notes")}
            label="📝 Notes"
          />
          <SurfaceTab
            active={surface === "canvas"}
            onClick={() => setSurfaceAndNotify("canvas")}
            label="🎨 Canvas"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copyLink}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            🔗 Share
          </button>
          <StatusPill status={status} synced={synced} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="relative min-h-0 min-w-0 flex-1">
          {provider && awareness && (
            <>
              <NotesSurface
                doc={doc}
                provider={provider}
                identity={identity}
                visible={surface === "notes"}
              />
              <CanvasSurface
                doc={doc}
                awareness={awareness}
                identity={identity}
                peers={peers}
                visible={surface === "canvas"}
                onActive={() => updateAwareness({ activeSurface: "canvas" })}
              />
            </>
          )}
          {!provider && (
            <div className="flex h-full items-center justify-center text-neutral-400">
              Connecting to room…
            </div>
          )}
        </main>

        <aside className="hidden w-56 shrink-0 border-l border-neutral-200 p-4 lg:block dark:border-neutral-800">
          <PresenceRail peers={peers} myId={identity.id} />
          <div className="mt-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
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
        </aside>
      </div>
    </div>
  );
}

function SurfaceTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-blue-600 text-white"
          : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      }`}
    >
      {label}
    </button>
  );
}

function StatusPill({
  status,
  synced,
}: {
  status: ConnectionStatus;
  synced: boolean;
}) {
  const dot =
    status === "connected"
      ? "bg-green-500"
      : status === "connecting"
        ? "bg-amber-500"
        : "bg-red-500";
  const label =
    status === "connected"
      ? synced
        ? "Saved"
        : "Saving…"
      : status === "connecting"
        ? "Connecting…"
        : "Reconnecting…";

  return (
    <span className="flex items-center gap-2 text-xs text-neutral-500">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
