import Link from "next/link";
import { Logo } from "./Logo";
import { DEMO_ARTIST } from "@/data/demoArtist";

const linkClass = "text-ink-muted transition-colors duration-200 hover:text-terracotta-dark";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-canvas-deep">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 font-display text-lg italic leading-snug text-ink/80">
            &ldquo;Build a world for your work.&rdquo;
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            A personal virtual museum for sharing art and creative portfolios -- walk through it,
            or share it with a friend.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm sm:flex sm:gap-16">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/60">Explore</p>
            <Link href={`/artist/${DEMO_ARTIST.username}`} className={linkClass}>
              Demo artist
            </Link>
            <Link href="/museum/demo-artist" className={linkClass}>
              Demo museum
            </Link>
            <Link href={`/artist/${DEMO_ARTIST.username}#grid`} className={linkClass}>
              Artwork grid
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/60">You</p>
            <Link href="/avatar" className={linkClass}>
              Customize avatar
            </Link>
            <Link href="/create" className={linkClass}>
              Create My Museum
            </Link>
          </div>
        </div>
      </div>
      <div className="rule-dotted mx-6" />
      <div className="px-6 py-5 text-center text-xs text-ink-muted">
        MyMuseum is a portfolio prototype. Artwork shown is original work by Alayna Huynh.
      </div>
    </footer>
  );
}
