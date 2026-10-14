"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmInline } from "@/components/ui/ConfirmInline";

type ReportState = "idle" | "confirming" | "reporting" | "error";

/** Recipient-only "report this message" action, one per message. There's
 * no moderation queue to review reports against yet -- this just captures
 * the flag (reported_at/report_reason on the row) so it isn't lost. */
export function ReportMessageButton({
  messageId,
  alreadyReported,
}: {
  messageId: string;
  alreadyReported: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<ReportState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleReport() {
    setState("reporting");
    setError(null);
    try {
      const res = await fetch(`/api/messages/report/${messageId}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Couldn't report this message.");
        setState("error");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error -- please try again.");
      setState("error");
    }
  }

  if (alreadyReported) {
    return <p className="text-xs text-ink-muted">Reported</p>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <ConfirmInline
        triggerLabel="Report"
        confirming={state === "confirming" || state === "reporting"}
        busy={state === "reporting"}
        onRequestConfirm={() => setState("confirming")}
        onCancel={() => setState("idle")}
        onConfirm={handleReport}
        confirmPrompt="Report this message to the site admin?"
        confirmLabel="Report"
        confirmingLabel="Reporting…"
        className="justify-start"
      />
      {error && <p className="text-xs text-dusty-red-dark">{error}</p>}
    </div>
  );
}
