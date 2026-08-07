"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { LinkButton } from "./Button";
import { DEMO_ARTIST } from "@/data/demoArtist";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { cn } from "@/utils/cn";

export const navLinkClass =
  "relative text-sm font-medium text-ink-muted transition-colors duration-200 hover:text-ink after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:origin-left after:scale-x-0 after:bg-terracotta after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100";

const EASE_OUT_SOFT = [0.16, 1, 0.3, 1] as const;

const HERO_INTRO_DELAY = 4.8;

/**
 * `heroIntro` is only passed on the homepage, where the fullscreen 3D museum
 * preview is meant to be the entire first impression -- the header stays
 * completely invisible while that plays out, then fades/slides down in on
 * top of it once the scene has had its moment. It's `fixed` rather than
 * `sticky` in this mode so it never reserves layout space: the hero can
 * stay a true 100dvh throughout, with zero layout shift when the header
 * appears. Every other page keeps the normal `sticky`, always-visible
 * header exactly as before.
 */
export function SiteHeader({ heroIntro = false }: { heroIntro?: boolean }) {
  return (
    <motion.header
      initial={heroIntro ? { opacity: 0, y: -22 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.4, delay: heroIntro ? HERO_INTRO_DELAY : 0, ease: EASE_OUT_SOFT }}
      className={cn(
        "top-0 z-40 border-b border-border/80 bg-canvas/90 shadow-warm-xs backdrop-blur-md",
        heroIntro ? "fixed inset-x-0" : "sticky"
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="rounded-full transition-opacity hover:opacity-80">
          <Logo />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-8 sm:flex">
          <Link href={`/artist/${DEMO_ARTIST.username}`} className={navLinkClass}>
            Demo artist
          </Link>
          <Link href="/avatar" className={navLinkClass}>
            Customize avatar
          </Link>
          <Link href="/create" className={navLinkClass}>
            Create My Museum
          </Link>
          <AuthStatus linkClassName={navLinkClass} />
        </nav>
        <LinkButton href="/museum/demo-artist" size="md">
          Enter museum
        </LinkButton>
      </div>
    </motion.header>
  );
}
