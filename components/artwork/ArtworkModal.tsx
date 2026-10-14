"use client";

import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import type { Artwork } from "@/types";

interface ArtworkModalProps {
  artworks: Artwork[];
  activeId: string;
  onClose: () => void;
  onNavigate: (id: string) => void;
  /** Whether the "Message the artist" action should render -- false for
   * the museum's own owner, or when the artist has disabled incoming
   * Museum Mail. */
  canMessageArtist: boolean;
  onMessageArtist: () => void;
}

const EASE_OUT_SOFT = [0.16, 1, 0.3, 1] as const;

/**
 * Focused, accessible artwork view: traps focus, restores it on close, and
 * supports looping previous/next navigation via buttons or arrow keys.
 * Rendered by its parent inside <AnimatePresence>, which drives this
 * component's exit animation when it's removed from the tree.
 */
export function ArtworkModal({
  artworks,
  activeId,
  onClose,
  onNavigate,
  canMessageArtist,
  onMessageArtist,
}: ArtworkModalProps) {
  const ordered = useMemo(
    () => [...artworks].sort((a, b) => a.displayOrder - b.displayOrder),
    [artworks]
  );
  const index = Math.max(0, ordered.findIndex((a) => a.id === activeId));
  const artwork = ordered[index];

  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const goTo = useCallback(
    (delta: number) => {
      const nextIndex = (index + delta + ordered.length) % ordered.length;
      onNavigate(ordered[nextIndex].id);
    },
    [index, ordered, onNavigate]
  );

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(1);
        return;
      }
      if (event.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusables = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goTo, onClose]);

  if (!artwork) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <motion.button
        type="button"
        aria-label="Close artwork view"
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
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 grid max-h-[90vh] w-full max-w-4xl grid-cols-1 gap-6 overflow-y-auto rounded-[1.75rem] border border-border/60 bg-surface p-5 shadow-warm-lg sm:p-8 md:grid-cols-[1.2fr_1fr]"
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.28, ease: EASE_OUT_SOFT }}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-canvas-deep text-ink-muted transition-colors duration-200 hover:bg-dusty-blue hover:text-surface"
        >
          <span aria-hidden="true">✕</span>
          <span className="sr-only">Close artwork view</span>
        </button>

        <motion.div
          key={`${artwork.id}-image`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT_SOFT }}
          className="flex items-center justify-center rounded-2xl border-[10px] border-canvas-deep bg-canvas-deep p-2 shadow-warm-xs"
        >
          {/* Original placeholder composition; see /public/artwork and README. */}
          <img
            src={artwork.imageUrl}
            alt={artwork.altText}
            className="max-h-[50vh] w-full rounded-sm object-contain md:max-h-[65vh]"
          />
        </motion.div>

        <motion.div
          key={`${artwork.id}-details`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.04, ease: EASE_OUT_SOFT }}
          className="flex flex-col"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta-dark">
            {index + 1} of {ordered.length}
          </p>
          <h2 id={titleId} className="mt-3 font-heading text-2xl text-ink sm:text-3xl">
            {artwork.title}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {artwork.artist} · {artwork.year} · {artwork.medium}
          </p>
          <div className="rule-dotted my-4" />
          <p id={descId} className="text-sm leading-relaxed text-ink">
            {artwork.description}
          </p>

          <div className="mt-auto flex items-center justify-between gap-3 pt-6">
            <button
              type="button"
              onClick={() => goTo(-1)}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink transition-colors duration-200 hover:border-dusty-blue hover:text-dusty-blue-dark"
            >
              <span aria-hidden="true">←</span> Previous
            </button>
            <button
              type="button"
              onClick={() => goTo(1)}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink transition-colors duration-200 hover:border-dusty-blue hover:text-dusty-blue-dark"
            >
              Next <span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-ink-muted underline-offset-4 transition-colors duration-200 hover:text-terracotta-dark hover:underline"
            >
              Return to museum
            </button>
            {canMessageArtist && (
              <button
                type="button"
                onClick={onMessageArtist}
                className="text-sm font-medium text-ink-muted underline-offset-4 transition-colors duration-200 hover:text-terracotta-dark hover:underline"
              >
                Message the artist about this piece
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
