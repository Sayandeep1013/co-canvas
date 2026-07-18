"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, FileText, Link2, Palette } from "lucide-react";
import { Identity, SurfaceId } from "@canvas/shared";
import {
  getOrCreateIdentity,
  hasCompletedIdentitySetup,
  saveIdentity,
} from "@/lib/identity";
import { useRoom, type ConnectionStatus } from "@/lib/yjs/useRoom";
import IdentityPrompt from "@/components/IdentityPrompt";
import PresenceCluster from "@/components/PresenceCluster";
import NotesSurface from "@/components/NotesSurface";
import CanvasSurface from "@/components/CanvasSurface";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Loader } from "@/components/ui/Loader";

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
      <div className="flex flex-1 items-center justify-center">
        <Loader label="Loading…" />
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
  const [copied, setCopied] = useState(false);

  const renameSelf = (name: string) => {
    const next = { ...identity, displayName: name };
    saveIdentity(next);
    onIdentity(next);
  };

  useEffect(() => {
    updateAwareness({ activeSurface: surface });
  }, [surface, updateAwareness]);

  const setSurfaceAndNotify = (s: SurfaceId) => {
    setSurface(s);
    updateAwareness({ activeSurface: s });
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas-bg">
      <header className="relative z-30 shrink-0 border-b border-canvas-border bg-canvas-surface/80 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="shrink-0 text-lg font-semibold text-canvas-ink"
            >
              Can<span className="text-canvas-accent">V</span>as
            </Link>
            <span className="hidden text-canvas-border sm:inline">·</span>
            <span className="truncate font-mono text-sm text-canvas-muted">
              {slug}
            </span>
          </div>

          <SegmentedControl<SurfaceId>
            value={surface}
            onChange={setSurfaceAndNotify}
            options={[
              {
                value: "notes",
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" aria-hidden />
                    Notes
                  </span>
                ),
              },
              {
                value: "canvas",
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5" aria-hidden />
                    Canvas
                  </span>
                ),
              },
            ]}
          />

          <div className="flex items-center gap-2">
            <PresenceCluster
              peers={peers}
              identity={identity}
              onRename={renameSelf}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={copyLink}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-canvas-success" aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </Button>
            <StatusPill status={status} synced={synced} />
          </div>
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
            <div className="flex h-full items-center justify-center">
              <Loader label="Connecting to room…" />
            </div>
          )}
        </main>
      </div>
    </div>
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
      ? "bg-canvas-success"
      : status === "connecting"
        ? "bg-canvas-warning"
        : "bg-canvas-danger";
  const label =
    status === "connected"
      ? synced
        ? "Saved"
        : "Saving…"
      : status === "connecting"
        ? "Connecting…"
        : "Reconnecting…";

  return (
    <span
      className="inline-flex items-center gap-2 rounded-xl border border-canvas-border bg-canvas-surface px-2.5 py-2 text-xs text-canvas-muted sm:px-3"
      title={label}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
