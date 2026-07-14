"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { randomRoomName, slugify } from "@canvas/shared";

export default function LandingPage() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const go = (raw: string) => {
    const slug = slugify(raw);
    if (!slug) return;
    router.push(`/r/${slug}`);
  };

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            Can<span className="text-blue-600">V</span>as
          </h1>
          <p className="mt-3 text-lg text-neutral-500">
            write + draw together, in realtime
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            go(value);
          }}
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <label
            htmlFor="room"
            className="mb-2 block text-sm font-medium text-neutral-600 dark:text-neutral-300"
          >
            Room name
          </label>
          <div className="flex gap-2">
            <input
              id="room"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. algorithms-week-3"
              className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-neutral-700 dark:bg-neutral-950"
            />
            <button
              type="submit"
              disabled={!slugify(value)}
              className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Go →
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => go(randomRoomName())}
              className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline dark:hover:text-neutral-200"
            >
              🎲 Surprise me
            </button>
            <span className="text-xs text-neutral-400">no account needed</span>
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-neutral-400">
          Type any name. If it exists you&apos;ll join it, if it doesn&apos;t
          you&apos;ll create it.
        </p>
      </div>
    </main>
  );
}
