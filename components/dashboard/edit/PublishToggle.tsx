"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { CopyLinkButton } from "@/components/museum/CopyLinkButton";

type SaveState = "idle" | "saving" | "error";

/** Owner-only publish/unpublish switch, plus the museum's permanent share
 * route and a Copy Link action right beneath it. Saves immediately on
 * change (no separate "Save" step, unlike the metadata form) since a
 * boolean toggle's intent is unambiguous the moment it's flipped.
 * Optimistically updates, then rolls back on failure. The share link lives
 * in this same component (rather than the page) specifically so its
 * "Private" caption always reflects the live toggle state, not a stale
 * server-rendered value that would only catch up after `router.refresh()`
 * completes. */
export function PublishToggle({
  museumId,
  initialIsPublished,
}: {
  museumId: string;
  initialIsPublished: boolean;
}) {
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(initialIsPublished);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  // The stable, permanent route -- shown here as-is (not resolved against a
  // host) because the real origin (localhost:3000 in dev, the real domain
  // in production) is only knowable in the browser, and reading
  // window.location.origin during render would differ between the server
  // render and the client, a hydration mismatch. CopyLinkButton sidesteps
  // that entirely by only reading window.location.origin inside its click
  // handler, which never runs during a render.
  const path = `/museum/${museumId}`;

  async function handleToggle() {
    const next = !isPublished;
    setIsPublished(next);
    setState("saving");
    setError(null);
    try {
      const res = await fetch(`/api/museums/${museumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setIsPublished(!next);
        setError(data?.error || "Couldn't update publish state.");
        setState("error");
        return;
      }
      setState("idle");
      router.refresh();
    } catch {
      setIsPublished(!next);
      setError("Network error -- please try again.");
      setState("error");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-ink">Visibility</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {isPublished
              ? "Published -- anyone with the link can visit."
              : "Private -- only you can see this museum."}
          </p>
          {error && <p className="mt-1 text-xs text-terracotta-dark">{error}</p>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPublished}
          aria-label="Toggle museum visibility"
          onClick={handleToggle}
          disabled={state === "saving"}
          className={cn(
            "relative h-8 w-14 shrink-0 rounded-full border transition-colors duration-200 ease-out disabled:opacity-60",
            isPublished ? "border-sage bg-sage" : "border-border bg-canvas-deep"
          )}
        >
          <span
            className={cn(
              "absolute top-1 h-6 w-6 rounded-full bg-surface shadow-warm-xs transition-transform duration-200 ease-out",
              isPublished ? "translate-x-7" : "translate-x-1"
            )}
          />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-5">
        <code className="max-w-full break-all rounded-lg bg-canvas-deep px-3 py-2 text-xs text-ink-muted">
          {path}
        </code>
        <CopyLinkButton path={path} isPrivate={!isPublished} />
      </div>
    </div>
  );
}
