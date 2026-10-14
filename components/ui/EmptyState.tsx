import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

/** Empty picture frame -- same stroke language (viewBox 32x32, strokeWidth
 * 1.6, currentColor) as the landing page's HowItWorks icons, so an empty
 * state reads as "an unhung wall" rather than a generic placeholder.
 * Exported so other components needing the same "nothing here yet" mark
 * (e.g. MuseumCard's cover placeholder) don't duplicate the SVG. */
export function EmptyFrameIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
      <rect x="7" y="5" width="18" height="20" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect
        x="10.5"
        y="8.5"
        width="11"
        height="13"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="2.2 2.4"
      />
      <path d="M10.5 27h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** "dark" sits this on a deep-tone SectionEnvironment (e.g. CommunityMuseums'
   * gallery-blue room) -- swaps the hardcoded ink/ink-muted text for surface
   * tones so it stays legible instead of rendering dark text on a dark wall. */
  tone?: "light" | "dark";
}

/** Shared empty-state card -- replaces the plain dashed gray box previously
 * hand-typed on the dashboard and create flow. */
export function EmptyState({ title, description, actions, className, tone = "light" }: EmptyStateProps) {
  const isDark = tone === "dark";
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center",
        isDark ? "border-surface/30 bg-surface/10" : "border-border bg-canvas-deep/50",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full border shadow-warm-xs",
          isDark ? "border-surface/30 bg-surface/10 text-surface" : "border-border bg-surface text-ink-muted"
        )}
      >
        <EmptyFrameIcon />
      </span>
      <p className={cn("font-heading text-xl", isDark ? "text-surface" : "text-ink")}>{title}</p>
      {description && (
        <p className={cn("mx-auto max-w-sm text-sm", isDark ? "text-surface/75" : "text-ink-muted")}>
          {description}
        </p>
      )}
      {actions && <div className="mt-2 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
    </div>
  );
}
