interface IconProps {
  className?: string;
}

/**
 * Small line-icon set for PageHeader/AuthGate badges. Same stroke language
 * as EmptyFrameIcon (currentColor, no fill) but a plainer 24x24 grid and a
 * touch heavier stroke -- these sit on a solid color tile at icon-badge
 * size, not floating on canvas, so they need to read at a glance rather
 * than reward close inspection.
 */

export function CompassIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 9l-2 5-5 2 2-5 5-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function MuseumIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 9.5L12 4l9 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 10v9M8 10v9M12 10v9M16 10v9M19.5 10v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 19.5h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PersonIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function EnvelopeIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 7l7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PencilIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M14.5 5.5l4 4-9.5 9.5H5v-4l9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13 7l4 4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/** Ascending staircase -- a step-by-step progression, for "how it works". */
export function StepsIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 20v-4h4v-4h4v-4h4V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PaletteIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 4a8 8 0 100 16c1.1 0 2-.9 2-2 0-.45-.16-.86-.43-1.18-.24-.29-.4-.65-.4-1.02 0-.83.67-1.5 1.5-1.5H16a4 4 0 004-4c0-3.3-3.58-6-8-6z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
      <circle cx="9.5" cy="7" r="1" fill="currentColor" />
      <circle cx="14.5" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

export function GroupIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.5" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2.8 20c1.2-3.4 3.7-5 6.2-5s5 1.6 6.2 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.2 15.3c2 .2 3.7 1.6 4.6 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
