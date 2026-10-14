"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { MAX_MESSAGE_BODY_LENGTH } from "@/lib/messages/limits";

type SendState = "idle" | "sending" | "error";

/** Reply form at the bottom of a thread. Deliberately re-fetches the page
 * (`router.refresh()`) on success rather than optimistically appending the
 * new message to a local list -- Museum Mail is asynchronous inbox mail,
 * not a live conversation, so a reply lands the same way any other page
 * update here does, not as a bubble that pops in. */
export function ReplyComposer({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setState("sending");
    setError(null);
    try {
      const res = await fetch(`/api/messages/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Couldn't send your reply.");
        setState("error");
        return;
      }
      setBody("");
      setState("idle");
      router.refresh();
    } catch {
      setError("Network error -- please try again.");
      setState("error");
    }
  }

  return (
    <div className="border-t border-border/70 pt-5">
      <TextAreaField
        label="Reply"
        rows={4}
        maxLength={MAX_MESSAGE_BODY_LENGTH}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a reply..."
        disabled={state === "sending"}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-ink-muted">
          {body.length} / {MAX_MESSAGE_BODY_LENGTH}
        </p>
        <Button type="button" onClick={handleSend} disabled={state === "sending" || !body.trim()}>
          {state === "sending" ? "Sending…" : "Send reply"}
        </Button>
      </div>
      {error && <p className="mt-1 text-sm text-dusty-red-dark">{error}</p>}
    </div>
  );
}
