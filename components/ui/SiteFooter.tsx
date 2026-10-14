import { LogoMark } from "./Logo";

/**
 * A closing plaque, not a website footer -- the platform's real navigation
 * lives in PlatformHud's fixed dock (Explore / My Museums / Create) and in
 * FinalCta's own links just above, so this repeats none of it. Bottom
 * padding is generous specifically to clear that fixed dock, which floats
 * over every page including this one.
 */
export function SiteFooter() {
  return (
    <footer className="bg-surface">
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-6 pt-14 pb-24 text-center sm:pb-28">
        <span className="inline-flex items-center gap-2 opacity-80">
          <LogoMark className="h-6 w-auto" />
          <span className="font-heading text-sm font-medium tracking-tight text-ink-muted">
            MyMuseum
          </span>
        </span>
        <p className="font-display text-sm italic text-ink-muted">
          &ldquo;Build a world for your work.&rdquo;
        </p>
        <div className="rule-dotted mt-1 w-10" aria-hidden="true" />
        <p className="text-xs text-ink-muted/75">
          A prototype platform for building and exploring virtual museums.
        </p>
      </div>
    </footer>
  );
}
