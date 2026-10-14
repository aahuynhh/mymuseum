import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

const sizes = {
  sm: {
    face: "px-3 py-2",
    title: "text-sm",
    subtitle: "text-xs",
  },
  md: {
    face: "px-4 py-3",
    title: "text-lg",
    subtitle: "text-sm",
  },
} as const;

/**
 * DOM counterpart to ArtworkFrame.tsx's 3D label plaque -- the same
 * two-plane spec (a flat dark edge behind a cream face, no blur) so gallery
 * signage reads the same whether it's rendered in the 3D room or here.
 * Rectangular, not pill-shaped: plaques are architectural signage, kept
 * visually distinct from the site's rounded-full buttons and rounded-2xl
 * cards.
 */
export function Plaque({
  eyebrow,
  title,
  subtitle,
  size = "md",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  const s = sizes[size];
  return (
    <div className={cn("relative inline-block max-w-full", className)}>
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-[3px] translate-y-[3px] rounded-sm bg-[#2c211c]"
      />
      <div className={cn("relative rounded-sm border border-[#e4d9c8] bg-[#faf7f2]", s.face)}>
        {eyebrow && (
          <p className="font-display text-xs italic text-[#8a7a6c]">{eyebrow}</p>
        )}
        <p className={cn("font-display text-[#3c2e28]", s.title)}>{title}</p>
        {subtitle && <p className={cn("mt-1 leading-relaxed text-[#5a4d44]", s.subtitle)}>{subtitle}</p>}
      </div>
    </div>
  );
}
