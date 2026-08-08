import { cn } from "@/utils/cn";

/** Shared lock/unlock icon pair -- same stroke language (viewBox 16,
 * strokeWidth 1.3, currentColor) used by both the Published/Private badge
 * and PublishToggle's switch thumb, so visibility state reads the same way
 * everywhere instead of relying on color alone (a colorblind-accessibility
 * gap the switch previously had). */
export function LockIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function UnlockIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

interface PublishBadgeProps {
  isPublished: boolean;
  className?: string;
}

export function PublishBadge({ isPublished, className }: PublishBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        isPublished ? "bg-sage/15 text-sage-dark" : "border border-border text-ink-muted",
        className
      )}
    >
      {isPublished ? <UnlockIcon /> : <LockIcon />}
      {isPublished ? "Published" : "Private"}
    </span>
  );
}
