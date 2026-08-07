"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

const CONTROLS = [
  { keys: "W A S D / Arrows", action: "Move around" },
  { keys: "Drag", action: "Look around" },
  { keys: "E / Enter", action: "View nearby artwork" },
  { keys: "Esc", action: "Close artwork" },
];

interface ControlsHintProps {
  onToggleGridView: () => void;
  gridViewActive: boolean;
  musicPlaying: boolean;
  onToggleMusic: () => void;
  exitHref: string;
  exitLabel: string;
}

export function ControlsHint({
  onToggleGridView,
  gridViewActive,
  musicPlaying,
  onToggleMusic,
  exitHref,
  exitLabel,
}: ControlsHintProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="fixed right-4 top-4 z-20 sm:right-6 sm:top-6">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-center gap-2 rounded-full bg-surface/95 px-4 py-2 text-sm font-medium text-ink shadow-warm-sm backdrop-blur-md transition-shadow duration-200 hover:shadow-warm-md"
      >
        Controls
        <span aria-hidden="true" className="text-xs">
          {expanded ? "▴" : "▾"}
        </span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 w-60 origin-top-right rounded-2xl border border-border/70 bg-surface/95 p-3 shadow-warm-md backdrop-blur-md"
          >
            <dl>
              {CONTROLS.map((c) => (
                <div key={c.action} className="flex items-center justify-between gap-3 py-1 text-sm">
                  <dt className="text-ink-muted">{c.action}</dt>
                  <dd className="font-medium text-ink">{c.keys}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-2 flex flex-col gap-1 border-t border-border/70 pt-2">
              <button
                type="button"
                onClick={onToggleGridView}
                className="rounded-lg px-2 py-1.5 text-left text-sm font-medium text-terracotta-dark transition-colors duration-200 hover:bg-canvas-deep"
              >
                {gridViewActive ? "Return to 3D museum" : "Switch to accessible grid view"}
              </button>
              <button
                type="button"
                onClick={onToggleMusic}
                className="rounded-lg px-2 py-1.5 text-left text-sm font-medium text-sage-dark transition-colors duration-200 hover:bg-canvas-deep"
              >
                {musicPlaying ? "Mute background music" : "Play background music"}
              </button>
              <Link
                href={exitHref}
                className="rounded-lg px-2 py-1.5 text-sm font-medium text-ink-muted transition-colors duration-200 hover:bg-canvas-deep hover:text-ink"
              >
                {exitLabel}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
