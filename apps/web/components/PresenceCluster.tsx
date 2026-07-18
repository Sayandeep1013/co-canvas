"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AwarenessState, Identity, SurfaceId } from "@canvas/shared";
import { FileText, Palette } from "lucide-react";
import type { PeerState } from "@/lib/yjs/useRoom";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";

const SURFACE: Record<SurfaceId, { icon: typeof FileText; label: string }> = {
  notes: { icon: FileText, label: "Notes" },
  canvas: { icon: Palette, label: "Canvas" },
};

interface Person {
  id: string;
  name: string;
  color: string;
  surface?: SurfaceId;
}

interface PresenceClusterProps {
  peers: PeerState[];
  identity: Identity;
  onRename: (name: string) => void;
}

const MAX_AVATARS = 4;

export default function PresenceCluster({
  peers,
  identity,
  onRename,
}: PresenceClusterProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Dedupe by user id (same person in two tabs = one avatar); put "you" first.
  const people = useMemo<Person[]>(() => {
    const map = new Map<string, Person>();
    for (const { state } of peers) {
      const u = (state as Partial<AwarenessState>).identity;
      if (!u?.id) continue;
      map.set(u.id, {
        id: u.id,
        name: u.displayName,
        color: u.color,
        surface: (state as Partial<AwarenessState>).activeSurface,
      });
    }
    const all = Array.from(map.values());
    all.sort((a, b) =>
      a.id === identity.id ? -1 : b.id === identity.id ? 1 : 0,
    );
    return all;
  }, [peers, identity.id]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const shown = people.slice(0, MAX_AVATARS);
  const overflow = people.length - shown.length;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${people.length} in this room`}
        aria-expanded={open}
        className="flex items-center rounded-full p-0.5 transition hover:bg-canvas-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent-soft"
      >
        <div className="flex -space-x-2">
          {shown.map((p) => (
            <div key={p.id} className="group/av relative">
              <Avatar
                name={p.name}
                color={p.color}
                size="sm"
                className={
                  p.id === identity.id ? "ring-2 ring-canvas-accent" : ""
                }
              />
              {/* hover = full name (+ where they are) */}
              <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-canvas-ink px-2 py-1 text-xs font-medium text-canvas-surface opacity-0 shadow-canvas-md transition-opacity group-hover/av:opacity-100">
                {p.name}
                {p.id === identity.id ? " (you)" : ""}
                {p.surface ? ` · ${SURFACE[p.surface].label}` : ""}
              </span>
            </div>
          ))}
          {overflow > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-canvas-bg-subtle text-xs font-semibold text-canvas-muted ring-2 ring-canvas-surface">
              +{overflow}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="fixed inset-x-3 top-[4.75rem] z-40 rounded-2xl border border-canvas-border bg-canvas-surface p-2 shadow-canvas-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72">
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-canvas-muted">
            In this room · {people.length}
          </p>
          <ul className="max-h-64 overflow-auto">
            {people.map((p) => {
              const S = p.surface ? SURFACE[p.surface] : null;
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5"
                >
                  <Avatar name={p.name} color={p.color} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm text-canvas-ink">
                    {p.name}
                    {p.id === identity.id && (
                      <span className="ml-1 text-xs text-canvas-muted">
                        (you)
                      </span>
                    )}
                  </span>
                  {S && (
                    <span className="inline-flex items-center gap-1 text-xs text-canvas-muted">
                      <S.icon className="h-3 w-3" aria-hidden />
                      {S.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-1 border-t border-canvas-border px-2 pb-1 pt-2.5">
            <label className="mb-1 block text-xs font-medium text-canvas-muted">
              Your name
            </label>
            <Input
              value={identity.displayName}
              onChange={(e) => onRename(e.target.value)}
              className="py-2 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
