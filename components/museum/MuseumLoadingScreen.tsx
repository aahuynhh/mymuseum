"use client";

import { motion } from "framer-motion";
import { LogoMark } from "@/components/ui/Logo";

export function MuseumLoadingScreen({ museumName }: { museumName?: string }) {
  return (
    <div className="relative flex h-full min-h-[100dvh] w-full flex-col items-center justify-center gap-4 overflow-hidden bg-canvas text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-64 w-64 rounded-full bg-terracotta/10 blur-3xl"
      />
      <motion.div
        className="relative"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <LogoMark className="h-16 w-auto" />
      </motion.div>
      <p className="relative font-heading text-lg text-ink">
        {museumName ? `Opening ${museumName}…` : "Opening the museum…"}
      </p>
      <p className="relative max-w-xs text-sm text-ink-muted">
        Loading the gallery, lighting, and artwork. This only takes a moment.
      </p>
    </div>
  );
}
