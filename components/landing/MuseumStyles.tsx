"use client";

import { motion } from "framer-motion";
import { GALLERY_THEME_LIST } from "@/game/museum/themes";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionEnvironment } from "@/components/ui/SectionEnvironment";
import { RoomPreview } from "@/components/landing/RoomPreview";
import { SectionIntro } from "@/components/landing/SectionIntro";
import { PaletteIcon } from "@/components/ui/PageIcons";

const EASE_OUT_SOFT = [0.16, 1, 0.3, 1] as const;

const STYLE_DETAILS: Record<string, { mood: string }> = {
  linen: { mood: "Ivory walls, natural wood, gold-trimmed frames -- the classic gallery." },
  "museum-blue": { mood: "Deep cobalt walls and warm gold frames, built for a confident centerpiece." },
  sage: { mood: "Calm and botanical, suited to quiet, considered work." },
  terracotta: { mood: "Warm and earthen, with the feel of natural light." },
  charcoal: { mood: "Moody and intimate -- each piece gets its own spotlight." },
};

/**
 * These are the same five GALLERY_THEMES used to render every real room in
 * the app (see game/museum/themes.ts) -- each card is a miniature wall/rail/
 * frame/floor preview built from the actual theme hex values, not a
 * marketing mockup, so this is an honest preview of what a museum can look
 * like rather than invented variety.
 */
export function MuseumStyles() {
  return (
    <SectionEnvironment tone="wood" id="museum-styles" className="py-16 sm:py-24">
      <ScrollReveal>
        <SectionIntro
          icon={<PaletteIcon />}
          accent="gold"
          title="One layout, five moods"
          description="Every gallery in MyMuseum picks from the same five curated palettes -- the actual wall colors your museum is built from, not a preview that doesn't match reality."
        />
      </ScrollReveal>

      <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {GALLERY_THEME_LIST.map((theme, i) => {
          const detail = STYLE_DETAILS[theme.id];
          return (
            <motion.li
              key={theme.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: EASE_OUT_SOFT }}
              className={`group relative aspect-[3/4] overflow-hidden rounded-md border border-border/60 shadow-warm-xs transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-warm-md ${
                i % 2 === 0 ? "sm:mt-0" : "sm:mt-6"
              }`}
            >
              <RoomPreview theme={theme} label={theme.label} mood={detail.mood} />
            </motion.li>
          );
        })}
      </ul>
    </SectionEnvironment>
  );
}
