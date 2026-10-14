"use client";

import { motion } from "framer-motion";
import { Hero3DPreviewLoader } from "./Hero3DPreviewLoader";

const EASE_OUT_SOFT = [0.16, 1, 0.3, 1] as const;

/**
 * The museum itself is the hero -- not a screenshot sitting under a headline.
 * The live 3D room fills the entire first screen edge-to-edge, immediately
 * below the header, with the title/copy floating over it (readable against
 * a top scrim) rather than pushing it down the page. A visitor can start
 * dragging to look around before they've read a word of copy.
 *
 * The overlay content arrives in a soft, staggered fade+rise rather than
 * appearing instantly -- a small touch, but it's the difference between the
 * page feeling assembled and feeling authored. The "drag to look around"
 * hint arrives last and later, like a quiet nudge rather than competing
 * with the headline for the first glance.
 */
export function Hero({ onReady }: { onReady: () => void }) {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative h-[100dvh] w-full">
        <Hero3DPreviewLoader onReady={onReady} />

        {/* Top scrim -- gives the overlaid title/CTA guaranteed contrast
            against whatever part of the museum happens to be in view,
            without needing a solid bar that would cover the room. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[62%] bg-gradient-to-b from-ink/80 via-ink/30 to-transparent"
        />

        {/* Title and copy -- sits in the upper third rather than pinned
            tight under the header (crowded once nothing followed it below,
            after the CTA buttons moved into the header) or dead-centered in
            the viewport (floats with as much empty space above as below,
            and competes with the room itself for visual weight). Leaves the
            museum -- the actual "hero" -- clearly visible through the
            larger, open lower portion of the screen. Pointer-events-none on
            the wrapper so a drag anywhere over the text still orbits the
            camera. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center px-6 pt-36 text-center sm:pt-44">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: EASE_OUT_SOFT }}
            className="mt-3 text-balance font-heading text-[2.1rem] leading-[1.05] text-surface sm:text-5xl lg:text-[3.4rem]"
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
    </section>
  );
}
