"use client";

import { motion } from "framer-motion";
import type { Artwork } from "@/types";

export function InteractionPrompt({
  artwork,
  onActivate,
}: {
  artwork: Artwork;
  onActivate: () => void;
}) {
  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 sm:bottom-10"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.button
        type="button"
        onClick={onActivate}
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-ink/90 px-5 py-3 text-sm font-medium text-surface shadow-warm-lg backdrop-blur"
      >
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-xs font-semibold text-ink"
        >
          E
        </span>
        Press E to view{" "}
        <span className="font-display italic">&ldquo;{artwork.title}&rdquo;</span>
      </motion.button>
    </motion.div>
  );
}
