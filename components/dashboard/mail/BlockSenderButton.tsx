"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmInline } from "@/components/ui/ConfirmInline";

type BlockState = "idle" | "confirming" | "busy" | "error";

/** Per-thread "block this sender" / "unblock" toggle. Blocking only stops
 * future notes from this person (enforced for real by message_blocks +
 * messages_insert_own's RLS check) -- it never hides or deletes the
 * conversation history already here. */
export function BlockSenderButton({
  otherUserId,
  otherDisplayName,
  initiallyBlocked,
}: {
  otherUserId: string;
  otherDisplayName: string;
  initiallyBlocked: boolean;
}) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [state, setState] = useState<BlockState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setState("busy");
    setError(null);
    try {
      const res = await fetch(`/api/messages/blocks/${otherUserId}`, {
        method: blocked ? "DELETE" : "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Couldn't update this block.");
        setState("error");
        return;
      }
      setBlocked((v) => !v);
      setState("idle");
      router.refresh();
    } catch {
      setError("Network error -- please try again.");
      setState("error");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <ConfirmInline
        triggerLabel={blocked ? "Unblock this sender" : "Block this sender"}
        confirming={state === "confirming" || state === "busy"}
        busy={state === "busy"}
        onRequestConfirm={() => setState("confirming")}
        onCancel={() => setState("idle")}
        onConfirm={handleConfirm}
        confirmPrompt={
          blocked
            ? `${otherDisplayName} will be able to send you notes again.`
            : `You won't receive further notes from ${otherDisplayName}.`
        }
        confirmLabel={blocked ? "Unblock" : "Block"}
        confirmingLabel={blocked ? "Unblocking…" : "Blocking…"}
      />
      {error && <p className="text-xs text-dusty-red-dark">{error}</p>}
    </div>
  );
}
