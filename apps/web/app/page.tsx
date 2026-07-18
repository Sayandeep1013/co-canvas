"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Dices, PenLine, Shapes } from "lucide-react";
import { randomRoomName, slugify } from "@canvas/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function LandingPage() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const go = (raw: string) => {
    const slug = slugify(raw);
    if (!slug) return;
    router.push(`/r/${slug}`);
  };

  return (
    <main className="canvas-dot-bg flex min-h-full flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
        <div className="mb-10 text-center">
          <Badge className="mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-canvas-success" />
            Realtime · no account
          </Badge>
          <h1 className="text-6xl font-semibold tracking-tight text-canvas-ink">
            Can<span className="text-canvas-accent">V</span>as
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-lg leading-relaxed text-canvas-muted">
            Write notes and sketch together — one room, two surfaces, no login.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-canvas-muted">
            <span className="inline-flex items-center gap-1.5">
              <PenLine className="h-4 w-4 text-canvas-accent" aria-hidden />
              Notes
            </span>
            <span className="text-canvas-border">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Shapes className="h-4 w-4 text-canvas-accent" aria-hidden />
              Canvas
            </span>
          </div>
        </div>

        <Card elevation="md" className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              go(value);
            }}
          >
            <label
              htmlFor="room"
              className="mb-2 block text-sm font-medium text-canvas-ink"
            >
              Room name
            </label>
            <div className="flex gap-2">
              <Input
                id="room"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. algorithms-week-3"
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!slugify(value)}
                className="shrink-0"
              >
                Go
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => go(randomRoomName())}
              >
                <Dices className="h-4 w-4" aria-hidden />
                Surprise me
              </Button>
              <span className="text-xs text-canvas-muted">no account needed</span>
            </div>
          </form>
        </Card>

        <p className="mt-5 text-center text-sm text-canvas-muted">
          Type any name — join if it exists, create if it doesn&apos;t.
        </p>
      </div>
    </main>
  );
}
