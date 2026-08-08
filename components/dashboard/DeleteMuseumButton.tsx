"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type DeleteState = "idle" | "confirming" | "deleting" | "error";

/**
 * Owner-only "delete this museum" action. Calls DELETE /api/museums/[id],
 * which deletes the Postgres row first (cascading to its artworks) and
 * only then best-effort cleans up the matching Storage objects -- see
 * server/museumsRepository.ts's deleteMuseum for why that order matters.
 */
export function DeleteMuseumButton({ museumId, museumName }: { museumId: string; museumName: string }) {
  const router = useRouter();
  const [state, setState] = useState<DeleteState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setState("deleting");
    setError(null);
    try {
      const res = await fetch(`/api/museums/${museumId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Couldn't delete this museum.");
        setState("error");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error -- please try again.");
      setState("error");
    }
  }

  if (state === "confirming" || state === "deleting") {
    return (
      <div className="flex flex-col items-end gap-2">
        <p className="text-xs text-ink-muted">
          Delete &ldquo;{museumName}&rdquo;? This can&apos;t be undone.
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => setState("idle")}
            disabled={state === "deleting"}
          >
            Cancel
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={handleDelete} disabled={state === "deleting"}>
            {state === "deleting" ? "Deleting…" : "Confirm delete"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setState("confirming")}
        className="text-xs font-medium text-ink-muted underline-offset-2 transition-colors hover:text-terracotta-dark hover:underline"
      >
        Delete museum
      </button>
      {error && <p className="text-xs text-terracotta-dark">{error}</p>}
    </div>
  );
}
