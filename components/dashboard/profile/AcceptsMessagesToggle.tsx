"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";

type SaveState = "idle" | "saving" | "error";

/** Owner-only Museum Mail on/off switch. Saves immediately on change (no
 * separate "Save" step, unlike ProfileEditor's batched form below it) --
 * same reasoning PublishToggle.tsx already states: a boolean's intent is
 * unambiguous the moment it's flipped, and this is a safety control besides,
 * which should take effect right away rather than sit pending in a dirty,
 * possibly-abandoned form. Optimistically updates, then rolls back on
 * failure. Turning this off only blocks new, unsolicited notes -- any
 * conversation already in progress keeps working (see
 * supabase/migrations/0010_museum_mail.sql's messages_insert_own policy). */
export function AcceptsMessagesToggle({ initialAcceptsMessages }: { initialAcceptsMessages: boolean }) {
  const [acceptsMessages, setAcceptsMessages] = useState(initialAcceptsMessages);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    const next = !acceptsMessages;
    setAcceptsMessages(next);
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptsMessages: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAcceptsMessages(!next);
        setError(data?.error || "Couldn't update Museum Mail.");
        setState("error");
        return;
      }
      setState("idle");
    } catch {
      setAcceptsMessages(!next);
      setError("Network error -- please try again.");
      setState("error");
    }
  }

  return (
    <section
      className={cn(
        "flex flex-col gap-5 rounded-[1.75rem] border border-l-4 p-6 shadow-warm-sm transition-colors duration-200 sm:p-8",
        acceptsMessages ? "border-border/70 border-l-sage bg-sage/5" : "border-border/70 border-l-border bg-surface"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl text-ink">Museum Mail</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {acceptsMessages
              ? "Signed-in visitors can leave you a private note about your museums or artwork."
              : "New notes are turned off. Conversations already in progress still work."}
          </p>
          {error && <p className="mt-1 text-xs text-dusty-red-dark">{error}</p>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={acceptsMessages}
          aria-label="Toggle Museum Mail"
          onClick={handleToggle}
          disabled={state === "saving"}
          className={cn(
            "relative h-8 w-14 shrink-0 rounded-full border transition-colors duration-200 ease-out disabled:opacity-60",
            acceptsMessages ? "border-sage bg-sage" : "border-border bg-canvas-deep"
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-1 h-6 w-6 rounded-full bg-surface shadow-warm-xs transition-transform duration-200 ease-out",
              acceptsMessages ? "translate-x-7" : "translate-x-1"
            )}
          />
        </button>
      </div>
    </section>
  );
}
