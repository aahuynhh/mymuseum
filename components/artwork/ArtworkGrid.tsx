"use client";

import type { Artwork } from "@/types";

interface ArtworkGridProps {
  artworks: Artwork[];
  onSelect: (id: string) => void;
}

/**
 * Non-3D fallback that lets any visitor browse the full collection as a
 * standard keyboard- and screen-reader-friendly grid, satisfying the
 * accessibility requirement for a route that doesn't depend on the museum
 * canvas at all.
 */
export function ArtworkGrid({ artworks, onSelect }: ArtworkGridProps) {
  const ordered = [...artworks].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {ordered.map((artwork) => (
        <li key={artwork.id}>
          <button
            type="button"
            onClick={() => onSelect(artwork.id)}
            className="group flex w-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface text-left shadow-warm-xs transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-warm-md"
          >
            <span className="aspect-[4/3] w-full overflow-hidden border-b border-border/60 bg-canvas-deep p-2.5">
              <span className="block h-full w-full overflow-hidden rounded-md">
                <img
                  src={artwork.imageUrl}
                  alt={artwork.altText}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </span>
            </span>
            <span className="flex flex-1 flex-col gap-1 p-4">
              <span className="font-display text-lg text-ink">{artwork.title}</span>
              <span className="text-sm text-ink-muted">
                {artwork.artist} · {artwork.year}
              </span>
              <span className="mt-2 flex items-center gap-1 text-sm font-medium text-terracotta-dark">
                View artwork{" "}
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
