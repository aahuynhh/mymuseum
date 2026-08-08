"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmInline } from "@/components/ui/ConfirmInline";

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

  return (
    <div className="flex flex-col items-end gap-1">
      <ConfirmInline
        triggerLabel="Delete museum"
        confirming={state === "confirming" || state === "deleting"}
        busy={state === "deleting"}
        onRequestConfirm={() => setState("confirming")}
        onCancel={() => setState("idle")}
        onConfirm={handleDelete}
        confirmPrompt={`Delete "${museumName}"? This can't be undone.`}
        confirmLabel="Confirm delete"
        confirmingLabel="Deleting…"
      />
      {error && <p className="text-xs text-dusty-red-dark">{error}</p>}
    </div>
  );
}
