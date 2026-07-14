"use client";

import { Identity, PALETTE } from "@canvas/shared";
import { useState } from "react";
import {
  markIdentitySetupComplete,
  saveIdentity,
} from "@/lib/identity";

interface IdentityPromptProps {
  roomSlug: string;
  identity: Identity;
  onComplete: (identity: Identity) => void;
}

/** First-time gate: pick a name + color before entering a room (DESIGN §5). */
export default function IdentityPrompt({
  roomSlug,
  identity,
  onComplete,
}: IdentityPromptProps) {
  const [name, setName] = useState(identity.displayName);
  const [color, setColor] = useState(identity.color);

  const enter = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next: Identity = { ...identity, displayName: trimmed, color };
    saveIdentity(next);
    markIdentitySetupComplete();
    onComplete(next);
  };

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500">You&apos;re joining</p>
        <p className="mb-6 font-mono text-lg font-semibold">{roomSlug}</p>

        <label className="mb-2 block text-sm font-medium text-neutral-600">
          Your name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enter()}
          placeholder="How should others see you?"
          className="mb-5 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-neutral-700 dark:bg-neutral-950"
        />

        <p className="mb-2 text-sm font-medium text-neutral-600">Your color</p>
        <div className="mb-6 flex flex-wrap gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Pick color ${c}`}
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full border-2 transition ${
                color === c ? "border-neutral-900 scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <button
          type="button"
          disabled={!name.trim()}
          onClick={enter}
          className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Enter room →
        </button>
      </div>
    </div>
  );
}
