"use client";

interface DraftArtwork {
  id: string;
  title: string;
  artist: string;
  description: string;
  medium: string;
  year: string;
  imageDataUrl: string;
  imageAspectRatio: number;
}

interface ArtworkDraftItemProps {
  artwork: DraftArtwork;
  index: number;
  onChange: (id: string, patch: Partial<DraftArtwork>) => void;
  onRemove: (id: string) => void;
}

export function ArtworkDraftItem({ artwork, index, onChange, onRemove }: ArtworkDraftItemProps) {
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-surface p-4 shadow-warm-xs sm:flex-row sm:p-5">
      <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl border border-border/60 bg-canvas-deep sm:w-32">
        {/* Client-provided preview of the visitor's own upload, not a demo asset */}
        <img src={artwork.imageDataUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Piece {index + 1}
          </p>
          <button
            type="button"
            onClick={() => onRemove(artwork.id)}
            className="text-xs font-medium text-ink-muted underline-offset-2 transition-colors hover:text-terracotta-dark hover:underline"
          >
            Remove
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">Title</span>
            <input
              type="text"
              required
              value={artwork.title}
              onChange={(e) => onChange(artwork.id, { title: e.target.value })}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus-visible:border-terracotta"
              placeholder="Untitled"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">Artist</span>
            <input
              type="text"
              required
              value={artwork.artist}
              onChange={(e) => onChange(artwork.id, { artist: e.target.value })}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus-visible:border-terracotta"
              placeholder="Your name"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">Medium</span>
            <input
              type="text"
              value={artwork.medium}
              onChange={(e) => onChange(artwork.id, { medium: e.target.value })}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus-visible:border-terracotta"
              placeholder="Oil on canvas"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">Year</span>
            <input
              type="number"
              value={artwork.year}
              onChange={(e) => onChange(artwork.id, { year: e.target.value })}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus-visible:border-terracotta"
              placeholder={String(new Date().getFullYear())}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">
            Description <span className="font-normal text-ink-muted">(optional -- also used as the accessible image description)</span>
          </span>
          <textarea
            value={artwork.description}
            onChange={(e) => onChange(artwork.id, { description: e.target.value })}
            rows={2}
            className="resize-none rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus-visible:border-terracotta"
            placeholder="A short note about this piece..."
          />
        </label>
      </div>
    </li>
  );
}

export type { DraftArtwork };
