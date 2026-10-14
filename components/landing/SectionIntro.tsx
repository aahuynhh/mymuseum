import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { PAGE_ACCENT_BG, type PageAccent } from "@/components/ui/pageAccents";

interface SectionIntroProps {
  icon: ReactNode;
  accent: PageAccent;
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned slot, e.g. CommunityMuseums' "View all museums" link. */
  actions?: ReactNode;
  /** SectionEnvironment's "deep"/"floor" tones sit copy in text-surface --
   * matches that per-section choice instead of assuming light. */
  dark?: boolean;
  className?: string;
}

/**
 * Homepage section intro: an icon badge beside a bold heading, the same
 * language PageHeader uses for the app's inner pages. Replaces the small
 * italic-serif "eyebrow" label (a dot + kicker word) every section used to
 * carry above its heading -- that kicker-over-headline pattern is generic
 * marketing-template shorthand; the badge does the same "which room is
 * this" job while looking like it belongs to this product.
 */
export function SectionIntro({ icon, accent, title, description, actions, dark = false, className }: SectionIntroProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-6", className)}>
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className={cn(
            "tile-bevel flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-surface sm:h-14 sm:w-14",
            PAGE_ACCENT_BG[accent]
          )}
        >
          {icon}
        </span>
        <div className="max-w-xl pt-0.5">
          <h2 className={cn("text-balance font-heading text-3xl font-semibold sm:text-4xl", dark ? "text-surface" : "text-ink")}>
            {title}
          </h2>
          {description && (
            <p className={cn("mt-3", dark ? "text-surface/75" : "text-ink-muted")}>{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
