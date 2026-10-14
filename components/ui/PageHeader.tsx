import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { PAGE_ACCENT_BG, type PageAccent } from "@/components/ui/pageAccents";

interface PageHeaderProps {
  /** Icon shown in the badge tile beside the title -- see components/ui/PageIcons.tsx.
   * Omit for headers that don't need one. */
  icon?: ReactNode;
  /** Fill color for the icon tile, one per page family (see pageAccents.ts). */
  accent?: PageAccent;
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned slot for a page-level action, e.g. a primary CTA button. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Shared page-header pattern: an icon badge beside a bold title, optionally
 * with a description and a trailing action. Deliberately has no small
 * italic label line above the title -- that eyebrow-over-heading pattern is
 * the first thing that reads as generic/AI-templated, and the badge tile
 * carries the same "which section is this" job instead.
 */
export function PageHeader({ icon, accent = "terracotta", title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-10 flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="flex items-start gap-4">
        {icon && (
          <span
            aria-hidden="true"
            className={cn(
              "tile-bevel flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-surface sm:h-14 sm:w-14",
              PAGE_ACCENT_BG[accent]
            )}
          >
            {icon}
          </span>
        )}
        <div className="max-w-2xl pt-0.5">
          <h1 className="text-balance font-heading text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
          {description && <p className="mt-2 text-ink-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
