import type { ReactNode } from "react";
import { RoomBoundary } from "./RoomBoundary";
import { cn } from "@/utils/cn";

const toneBackground = {
  cream: "bg-surface",
  wood: "bg-canvas-deep",
  deep: "bg-gallery-blue",
  floor: "bg-gallery-floor",
} as const;

export type SectionTone = keyof typeof toneBackground;

const darkTones = new Set<SectionTone>(["deep", "floor"]);

/**
 * Gives each homepage section its own "room" background instead of every
 * section sharing one flat cream page -- callers using a dark tone ("deep"
 * or "floor") must author their own copy in text-surface/text-surface/70,
 * since both backgrounds are dark.
 */
export function SectionEnvironment({
  tone,
  id,
  boundary = true,
  bottomBoundary = false,
  className,
  children,
}: {
  tone: SectionTone;
  id?: string;
  boundary?: boolean;
  /** Adds a second molding line at the section's bottom edge, like a
   * baseboard -- off by default so it's opt-in per section rather than
   * changing every room's silhouette. */
  bottomBoundary?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const boundaryTone = darkTones.has(tone) ? "on-dark" : "on-light";
  return (
    <section id={id} className={toneBackground[tone]}>
      {boundary && <RoomBoundary tone={boundaryTone} />}
      <div className={cn("mx-auto w-full max-w-6xl px-6", className)}>{children}</div>
      {bottomBoundary && <RoomBoundary tone={boundaryTone} />}
    </section>
  );
}
