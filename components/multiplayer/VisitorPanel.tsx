"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Player } from "@/types";
import type { ConnectionStatus } from "@/hooks/useMultiplayer";

export function VisitorPanel({
  visitorCount,
  roster,
  status,
  localDisplayName,
}: {
  visitorCount: number;
  roster: Player[];
  status: ConnectionStatus;
  localDisplayName: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusLabel =
    status === "connected"
      ? "Live"
      : status === "connecting"
        ? "Connecting…"
        : status === "solo"
          ? "Solo visit"
          : "Reconnecting…";

  return (
    <div className="fixed left-4 top-4 z-20 sm:left-6 sm:top-6">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-center gap-2 rounded-full bg-surface/95 px-4 py-2 text-sm font-medium text-ink shadow-warm-sm backdrop-blur-md transition-shadow duration-200 hover:shadow-warm-md"
      >
        <span
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${
            status === "connected"
              ? "bg-sage"
              : status === "solo"
                ? "bg-ink-muted"
                : "bg-antique-gold"
          }`}
        />
        {visitorCount} {visitorCount === 1 ? "visitor" : "visitors"}
        <span className="text-ink-muted">· {statusLabel}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 w-56 origin-top-left rounded-2xl border border-border/70 bg-surface/95 p-3 shadow-warm-md backdrop-blur-md"
          >
            <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
              In this museum
            </p>
            <ul className="flex flex-col gap-1">
              <li className="rounded-lg px-2 py-1.5 text-sm font-medium text-ink">
                {localDisplayName} <span className="text-ink-muted">(you)</span>
              </li>
              {roster.map((player) => (
                <li key={player.id} className="rounded-lg px-2 py-1.5 text-sm text-ink">
                  {player.displayName}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
