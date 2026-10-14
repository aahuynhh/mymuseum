"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LinkButton, Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { MAX_MESSAGE_BODY_LENGTH } from "@/lib/messages/limits";

const EASE_OUT_SOFT = [0.16, 1, 0.3, 1] as const;

type SendState = "idle" | "sending" | "success" | "error";

/** Who the note is going to, and what it's about. "museum" is the existing
 * in-viewer entry point (ControlsHint's Options list, ArtworkModal's action
 * row); "profile" is a direct note from an artist's public profile page,
 * with no museum/artwork context attached to the message. */
export type ComposerTarget =
  | { type: "museum"; museumId: string; museumName: string; artworkId: string | null; artworkTitle: string | null }
  | { type: "profile"; recipientId: string; recipientName: string };

/**
 * "Leave a note" / "Message the artist" composer -- opened from
 * ControlsHint's Options list and ArtworkModal's action row inside a museum
 * (see MuseumExperience.tsx), and from the "Message" button on an artist's
 * public profile page (see MessageArtistButton.tsx). Deliberately small and
 * single-purpose, unlike ArtworkModal's two-column gallery-piece layout, but
 * reuses the same overlay shell (fixed scrim + focus trap/restore +
 * Escape-to-close) since no shared hook for that exists yet in this
 * codebase.
 *
 * Museum Mail is asynchronous, not chat: sending shows a plain inline
 * confirmation and the modal closes itself a moment later -- there's no
 * live delivery state, no "artist is viewing" indicator, nothing to watch
 * happen in real time.
 */
export function NoteComposerModal({
  target,
  currentUserId,
  onClose,
}: {
  target: ComposerTarget;
  currentUserId: string | null;
  onClose: () => void;
}) {
  const [body, setBody] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (state !== "success") return;
    const timer = setTimeout(onClose, 2600);
    return () => clearTimeout(timer);
  }, [state, onClose]);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          target.type === "museum"
            ? { museumId: target.museumId, artworkId: target.artworkId, body: trimmed }
            : { recipientId: target.recipientId, body: trimmed }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Couldn't send your note.");
        setState("error");
        return;
      }
      setState("success");
    } catch {
      setError("Network error -- please try again.");
      setState("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <motion.button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-ink/75 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: EASE_OUT_SOFT }}
      />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={currentUserId ? "Leave a note" : "Sign in to leave a note"}
        className="relative z-10 w-full max-w-md rounded-[1.75rem] border border-border/60 bg-surface p-6 shadow-warm-lg sm:p-8"
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.28, ease: EASE_OUT_SOFT }}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-canvas-deep text-ink-muted transition-colors duration-200 hover:bg-dusty-blue hover:text-surface"
        >
          <span aria-hidden="true">✕</span>
          <span className="sr-only">Close</span>
        </button>

        {currentUserId === null ? (
          <div className="text-center">
            <p className="font-display text-sm italic text-terracotta-dark">Museum Mail</p>
            <h2 className="mt-2 font-heading text-xl text-ink">Sign in to leave a note</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-ink-muted">
              Notes are private, one-to-one, and tied to your account -- sign in to send one.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <LinkButton href="/sign-in" size="md">
                Sign in
              </LinkButton>
              <LinkButton href="/sign-up" variant="secondary" size="md">
                Create an account
              </LinkButton>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 text-sm font-medium text-ink-muted underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
            >
              Cancel
            </button>
          </div>
        ) : state === "success" ? (
          <div className="py-6 text-center">
            <p className="font-display text-sm italic text-sage-dark">Note sent</p>
            <h2 className="mt-2 font-heading text-xl text-ink">
              {target.type === "profile"
                ? `Your note to ${target.recipientName} is on its way.`
                : target.museumName === ""
                  ? "Your note is on its way."
                  : `Your note to ${target.museumName}'s artist is on its way.`}
            </h2>
          </div>
        ) : (
          <div>
            <p className="font-display text-sm italic text-terracotta-dark">Museum Mail</p>
            <h2 className="mt-2 font-heading text-xl text-ink">
              {target.type === "profile"
                ? `Message ${target.recipientName}`
                : target.artworkTitle
                  ? `Message the artist about "${target.artworkTitle}"`
                  : "Leave a note for the artist"}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {target.type === "profile"
                ? "This goes straight to them, privately."
                : `About ${target.museumName}. This goes straight to them, privately.`}
            </p>

            <div className="mt-4">
              <TextAreaField
                label="Your note"
                rows={5}
                maxLength={MAX_MESSAGE_BODY_LENGTH}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Say hello, ask a question, or share what you thought..."
                disabled={state === "sending"}
              />
              <p className="mt-1 text-right text-xs text-ink-muted">
                {body.length} / {MAX_MESSAGE_BODY_LENGTH}
              </p>
            </div>

            {error && <p className="mt-1 text-sm text-dusty-red-dark">{error}</p>}

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium text-ink-muted underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
              >
                Cancel
              </button>
              <Button
                type="button"
                onClick={handleSend}
                disabled={state === "sending" || !body.trim()}
              >
                {state === "sending" ? "Sending…" : "Send note"}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
