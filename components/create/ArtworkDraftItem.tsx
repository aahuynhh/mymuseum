"use client";

import { TextField, TextAreaField } from "@/components/ui/Field";

interface DraftArtwork {
  id: string;
  title: string;
  artist: string;
  description: string;
  medium: string;
  year: string;
  /** Client-compressed image, sent as real bytes (not base64) on submit.
   * Server-side validation (sharp) is the actual authority on type/size/
   * dimensions -- this is a bandwidth/UX optimization only. */
  imageBlob: Blob;
  /** Object URL for the local preview only -- revoked by the parent form
   * when this draft is removed or replaced. */
  previewUrl: string;
  /** Client-estimated aspect ratio, shown immediately in the preview.
   * Not trusted server-side -- the server re-derives it from the real
   * uploaded bytes. */
  imageAspectRatio: number;
}

interface ArtworkDraftItemProps {
  artwork: DraftArtwork;
  index: number;
  isCover: boolean;
  onChange: (id: string, patch: Partial<DraftArtwork>) => void;
  onRemove: (id: string) => void;
  onSetCover: (id: string) => void;
}

export function ArtworkDraftItem({
  artwork,
  index,
  isCover,
  onChange,
  onRemove,
  onSetCover,
}: ArtworkDraftItemProps) {
  const missingRequired = !artwork.title.trim() || !artwork.artist.trim();

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-surface p-4 shadow-warm-xs sm:flex-row sm:p-5">
      <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl border border-border/60 bg-canvas-deep sm:w-32">
        {/* Client-provided preview of the visitor's own upload, not a demo asset */}
        <img src={artwork.previewUrl} alt="" className="h-full w-full object-cover" />
        {isCover && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-terracotta px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-canvas shadow-warm-xs">
            Cover
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Piece {index + 1}
            </p>
            {missingRequired && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-antique-gold-dark">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-antique-gold" />
                Needs a title and artist
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isCover && (
              <button
                type="button"
                onClick={() => onSetCover(artwork.id)}
                className="text-xs font-medium text-ink-muted underline-offset-2 transition-colors hover:text-terracotta-dark hover:underline"
              >
                Set as cover
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemove(artwork.id)}
              className="text-xs font-medium text-ink-muted underline-offset-2 transition-colors hover:text-terracotta-dark hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            compact
            label="Title"
            type="text"
            required
            value={artwork.title}
            onChange={(e) => onChange(artwork.id, { title: e.target.value })}
            placeholder="Untitled"
          />
          <TextField
            compact
            label="Artist"
            type="text"
            required
            value={artwork.artist}
            onChange={(e) => onChange(artwork.id, { artist: e.target.value })}
            placeholder="Your name"
          />
          <TextField
            compact
            label="Medium"
            type="text"
            value={artwork.medium}
            onChange={(e) => onChange(artwork.id, { medium: e.target.value })}
            placeholder="Oil on canvas"
          />
          <TextField
            compact
            label="Year"
            type="number"
            value={artwork.year}
            onChange={(e) => onChange(artwork.id, { year: e.target.value })}
            placeholder={String(new Date().getFullYear())}
          />
        </div>
        <TextAreaField
          compact
          label="Description"
          hint="(optional -- also used as the accessible image description)"
          value={artwork.description}
          onChange={(e) => onChange(artwork.id, { description: e.target.value })}
          rows={2}
          placeholder="A short note about this piece..."
        />
      </div>
    </li>
  );
}

export type { DraftArtwork };
