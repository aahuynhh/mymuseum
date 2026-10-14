"use client";

import { motion } from "framer-motion";
import { LogoMark } from "@/components/ui/Logo";

const EASE_OUT_SOFT = [0.16, 1, 0.3, 1] as const;

/**
 * The brief, branded hold shown in place of the sign-in/sign-up form while
 * a submission is in flight -- the same pulsing-logo language as
 * MuseumLoadingScreen, so waiting always looks like the same thing
 * everywhere in the app. framer-motion's global reducedMotion="user"
 * config (MotionProvider) automatically strips the pulse's transform
 * animation under prefers-reduced-motion, keeping only the opacity fade.
 */
export function AuthTransition({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT_SOFT }}
      className="flex flex-col items-center gap-4 rounded-2xl border border-border/70 bg-surface px-8 py-16 text-center"
    >
      <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
        <LogoMark className="h-12 w-auto" />
      </motion.div>
      <div>
        <p className="font-heading text-xl text-ink">{title}</p>
        <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>
      </div>
    </motion.div>
  );
}
