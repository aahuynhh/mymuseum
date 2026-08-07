"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const EASE_OUT_SOFT = [0.16, 1, 0.3, 1] as const;

/**
 * A soft fade+rise as content enters the viewport -- used throughout the
 * sections below the hero so the page reveals itself as you scroll instead
 * of everything just being statically "there." `once` so it never
 * re-triggers on scroll-back, which would feel gimmicky rather than premium.
 */
export function ScrollReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: EASE_OUT_SOFT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
