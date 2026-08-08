import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface PageHeaderProps {
  /** Short italic label above the title -- must describe *this* page, not a
   * generic funnel name (see MEMORY: the "Create My Museum" eyebrow used to
   * be copy-pasted across sign-in/sign-up/dashboard/create regardless of
   * which page it was on). */
  eyebrow: string;
  /** Color of the small bullet before the eyebrow, matching the dot motif
   * already used in the landing page's marketing sections (Hero, HowItWorks,
   * FeaturedArtist, MuseumStyles). Defaults to the brand accent. */
  dotClassName?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned slot for a page-level action, e.g. a primary CTA button. */
  actions?: ReactNode;
  className?: string;
}

/** Shared page-header pattern: eyebrow + title + description, optionally
 * with a trailing action. Consolidates what was previously hand-typed on
 * every account/creator page. */
export function PageHeader({
  eyebrow,
  dotClassName = "bg-terracotta",
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-10 flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="max-w-2xl">
        <p className="flex items-center gap-2 font-display text-sm italic text-terracotta-dark">
          <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClassName)} />
          {eyebrow}
        </p>
        <h1 className="mt-2 text-balance font-display text-3xl text-ink sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
