"use client";

import { motion } from "framer-motion";
import { GALLERY_THEME_LIST } from "@/game/museum/themes";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const EASE_OUT_SOFT = [0.16, 1, 0.3, 1] as const;

/** WCAG relative-luminance check (with proper sRGB gamma correction) so
 * each swatch's own text stays legible -- the five theme wall colors range
 * from near-white (linen) to near-black (charcoal), so a single hardcoded
 * text color would fail contrast on some of them. A naive linear-RGB
 * weighted sum (skipping gamma correction) misjudges mid-tones like
 * terracotta as lighter than they actually are, so this linearizes each
 * channel first. */
function isLight(hex: string): boolean {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = channel(parseInt(hex.slice(1, 3), 16));
  const g = channel(parseInt(hex.slice(3, 5), 16));
  const b = channel(parseInt(hex.slice(5, 7), 16));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.24;
}

const STYLE_DETAILS: Record<string, { mood: string }> = {
  linen: { mood: "Soft gallery-white -- lets color do the talking." },
  "museum-blue": { mood: "Deep and dramatic, built for a confident centerpiece." },
  sage: { mood: "Calm and botanical, suited to quiet, considered work." },
  terracotta: { mood: "Warm and earthen, with the feel of natural light." },
  charcoal: { mood: "Moody and intimate -- each piece gets its own spotlight." },
};

/**
 * These are the same five GALLERY_THEMES used to render every real room in
 * the app (see game/museum/themes.ts) -- the wall-color swatches here are
 * the actual theme hex values, not a marketing mockup, so this is an
 * honest preview of what a museum can look like rather than invented
 * variety.
 */
export function MuseumStyles() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24" id="museum-styles">
      <ScrollReveal className="max-w-xl">
        <p className="flex items-center gap-2 font-display text-sm italic text-terracotta-dark">
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-flax" />
          Room styles
        </p>
        <h2 className="mt-2 text-balance font-display text-3xl text-ink sm:text-4xl">
          One layout, five moods
        </h2>
        <p className="mt-4 text-ink-muted">
          Every gallery in MyMuseum picks from the same five curated palettes -- the actual wall
          colors your museum is built from, not a preview that doesn&apos;t match reality.
        </p>
      </ScrollReveal>

      <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {GALLERY_THEME_LIST.map((theme, i) => {
          const detail = STYLE_DETAILS[theme.id];
          const light = isLight(theme.wallColor);
          return (
            <motion.li
              key={theme.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: EASE_OUT_SOFT }}
              className={`group relative overflow-hidden rounded-2xl border border-border/60 shadow-warm-xs transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-warm-md ${
                i % 2 === 0 ? "sm:mt-0" : "sm:mt-6"
              }`}
              style={{ backgroundColor: theme.wallColor }}
            >
              <div className="flex aspect-[3/4] flex-col justify-end p-4">
                <div
                  className="mt-3 h-px w-8 opacity-70"
                  style={{ backgroundColor: theme.railColor }}
                  aria-hidden="true"
                />
                <p className={`mt-3 font-display text-base italic ${light ? "text-ink" : "text-surface"}`}>
                  {theme.label}
                </p>
                <p className={`mt-1 text-xs leading-relaxed ${light ? "text-ink-muted" : "text-surface/90"}`}>
                  {detail.mood}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
