"use client";

import { Identity, PALETTE } from "@canvas/shared";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import {
  markIdentitySetupComplete,
  saveIdentity,
} from "@/lib/identity";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

interface IdentityPromptProps {
  roomSlug: string;
  identity: Identity;
  onComplete: (identity: Identity) => void;
}

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
    <div className="canvas-dot-bg flex flex-1 items-center justify-center px-6 py-16">
      <Card elevation="md" className="w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-4">
          <Avatar name={name || "?"} color={color} size="lg" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-canvas-muted">
              Joining room
            </p>
            <p className="truncate font-mono text-lg font-semibold text-canvas-ink">
              {roomSlug}
            </p>
          </div>
        </div>

        <label className="mb-2 block text-sm font-medium text-canvas-ink">
          Your name
        </label>
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enter()}
          placeholder="How should others see you?"
          className="mb-5"
        />

        <p className="mb-2 text-sm font-medium text-canvas-ink">Your color</p>
        <div className="mb-7 grid grid-cols-6 gap-2.5">
          {PALETTE.map((c) => {
            const active = color === c;
            return (
              <button
                key={c}
                type="button"
                aria-label={`Pick color ${c}`}
                aria-pressed={active}
                onClick={() => setColor(c)}
                className={`flex aspect-square items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent-soft ${
                  active
                    ? "ring-2 ring-canvas-ink ring-offset-2 ring-offset-canvas-surface"
                    : "hover:scale-110"
                }`}
                style={{ backgroundColor: c }}
              >
                {active && (
                  <Check className="h-4 w-4 text-white drop-shadow" aria-hidden />
                )}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          disabled={!name.trim()}
          onClick={enter}
          className="w-full"
        >
          Enter room
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </Card>
    </div>
  );
}
