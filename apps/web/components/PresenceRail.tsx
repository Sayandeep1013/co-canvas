"use client";

import { AwarenessState, Identity, SurfaceId } from "@canvas/shared";
import type { PeerState } from "@/lib/yjs/useRoom";

const SURFACE_ICON: Record<SurfaceId, string> = {
  notes: "📝",
  canvas: "🎨",
};

interface PresenceRailProps {
  peers: PeerState[];
  myId: string;
}

export default function PresenceRail({ peers, myId }: PresenceRailProps) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        In this room
      </h3>
      <ul className="space-y-2">
        {peers.length === 0 && (
          <li className="text-sm text-neutral-400">Connecting…</li>
        )}
        {peers.map(({ clientId, state }) => {
          const user = state.user as Identity | undefined;
          if (!user?.id) return null;
          const surface = state.activeSurface as SurfaceId | undefined;
          return (
            <li key={clientId} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: user.color }}
              />
              <span className="truncate">{user.displayName}</span>
              {user.id === myId && (
                <span className="text-xs text-neutral-400">(you)</span>
              )}
              {surface && (
                <span className="ml-auto text-xs text-neutral-400">
                  {SURFACE_ICON[surface]}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
