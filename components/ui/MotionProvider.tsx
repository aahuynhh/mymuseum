"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Applies framer-motion's built-in `prefers-reduced-motion` handling
 * app-wide. The global CSS rule in globals.css only catches native CSS
 * transitions/animations; framer-motion drives its animations directly via
 * JS, so it needs this separately. `reducedMotion="user"` automatically
 * strips transform/scale motion for users who prefer reduced motion while
 * still allowing simple opacity fades, matching framer-motion's own
 * recommended accessible default.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
