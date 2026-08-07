"use client";

import { motion } from "framer-motion";
import { LinkButton } from "@/components/ui/Button";
import { Hero3DPreviewLoader } from "./Hero3DPreviewLoader";

const EASE_OUT_SOFT = [0.16, 1, 0.3, 1] as const;

/**
 * The museum itself is the hero -- not a screenshot sitting under a headline.
 * The live 3D room fills the entire first screen edge-to-edge, immediately
 * below the header, with the title/copy/CTA floating over it (readable
 * against a top scrim) rather than pushing it down the page. A visitor can
 * start dragging to look around before they've read a word of copy.
 *
 * The overlay content arrives in a soft, staggered fade+rise rather than
 * appearing instantly -- a small touch, but it's the difference between the
 * page feeling assembled and feeling authored. The "drag to look around"
 * hint arrives last and later, like a quiet nudge rather than competing
 * with the headline for the first glance.
 */
export function Hero() {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative h-[100dvh] w-full">
        <Hero3DPreviewLoader />

        {/* Top scrim -- gives the overlaid title/CTA guaranteed contrast
            against whatever part of the museum happens to be in view,
            without needing a solid bar that would cover the room. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[62%] bg-gradient-to-b from-ink/80 via-ink/30 to-transparent"
        />

        {/* Title, copy, and CTA -- pointer-events-none on the wrapper so a
            drag anywhere over the text still orbits the camera; only the
            buttons themselves re-enable pointer events. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center px-6 pt-24 text-center sm:pt-28">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_SOFT }}
            className="font-display text-sm italic text-surface/85 sm:text-base"
          >
            <span aria-hidden="true">— </span>
            Showcase, share, and view art
            <span aria-hidden="true"> —</span>
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1, ease: EASE_OUT_SOFT }}
            className="mt-3 text-balance font-display text-[2.1rem] leading-[1.05] text-surface sm:text-5xl lg:text-[3.4rem]"
          >
            Create a world for your work.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22, ease: EASE_OUT_SOFT }}
            className="mx-auto mt-3 max-w-md text-balance text-sm leading-relaxed text-surface/85 sm:text-base"
          >
            Upload your work, build a museum, and invite people in
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.34, ease: EASE_OUT_SOFT }}
            className="pointer-events-auto mt-6 flex flex-wrap items-center justify-center gap-4"
          >
            <LinkButton
              href="/museum/demo-artist"
              size="lg"
              className="!px-9 !py-3.5 !text-[1.02rem] shadow-[0_20px_40px_-12px_rgba(70,89,107,0.55)] ring-4 ring-dusty-blue/25 hover:ring-dusty-blue/35"
            >
              Enter Alayna's Museum
            </LinkButton>
            <LinkButton
              href="/avatar"
              variant="ghost"
              size="lg"
              className="!border !border-dusty-blue/50 !text-surface/90 hover:!border-dusty-blue hover:!bg-dusty-blue/15 hover:!text-surface"
            >
              Customize Avatar
            </LinkButton>
          </motion.div>
        </div>

        {/* A quiet nudge toward the one interaction most visitors will
            otherwise miss, sitting just above Hero3DPreview's own bottom
            info bar (museum name + live visitor count). Arrives late and
            gently, after the headline has had a moment to land. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 1.1, ease: EASE_OUT_SOFT }}
          className="pointer-events-none absolute inset-x-0 bottom-16 z-10 flex justify-center sm:bottom-20"
        >
          <motion.span
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-full bg-ink/45 px-3.5 py-1.5 text-xs text-surface/90 backdrop-blur-sm"
          >
            Drag to look around live museum
          </motion.span>
        </motion.div>
      </div>

      <p className="mx-auto flex max-w-2xl items-center justify-center gap-2 px-6 py-3 text-center text-xs text-ink-muted">
        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-flax" />
        Open in two tabs to see live multiplayer in action.
      </p>
    </section>
  );
}
