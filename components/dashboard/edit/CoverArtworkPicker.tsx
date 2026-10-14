"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Artwork } from "@/types";
import { cn } from "@/utils/cn";
import { SaveStatus, type SaveStatusState } from "@/components/ui/SaveStatus";

/** Owner-only cover thumbnail picker: a grid of every artwork already
 * uploaded to this museum, radio-style, so the dashboard/explore card can
 * show a specific piece instead of always defaulting to the first upload
 * (see server/museumsRepository.ts's getCoverImageUrls). Clicking a tile
 * only updates the selection locally -- same explicit "Save changes" pattern
 * as EditMuseumMetadataForm, not the auto-save-on-click PublishToggle uses,
 * since picking a thumbnail is easy to do by mistake while browsing the
 * grid and shouldn't commit until the owner confirms it. */
export function CoverArtworkPicker({
  museumId,
  artworks,
  initialCoverArtworkId,
}: {
  museumId: string;
  artworks: Artwork[];
  initialCoverArtworkId: string | null;
}) {
  const router = useRouter();
  // Falls back to the first artwork by display order, matching the server's
  // own default so the highlighted tile always reflects what's actually
  // showing on the dashboard card right now.
  const fallbackId = artworks[0]?.id ?? null;
  const initialSelectedId = initialCoverArtworkId ?? fallbackId;
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [state, setState] = useState<SaveStatusState>("idle");
  const [error, setError] = useState<string | null>(null);

  if (artworks.length < 2) return null;

  const isDirty = selectedId !== initialSelectedId;
  const displayState: SaveStatusState = state === "success" && isDirty ? "idle" : state;

  async function handleSave() {
    setState("saving");
    setError(null);
    try {
      const res = await fetch(`/api/museums/${museumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverArtworkId: selectedId === fallbackId ? null : selectedId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Couldn't update the cover thumbnail.");
        setState("error");
        return;
      }
      setState("success");
      router.refresh();
    } catch {
      setError("Network error -- please try again.");
      setState("error");
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-[1.75rem] border border-border/70 bg-surface p-6 shadow-warm-sm sm:p-8">
      <div>
        <h2 className="font-heading text-xl text-ink">Cover thumbnail</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Pick which uploaded piece represents this museum on your dashboard and the explore page.
        </p>
      </div>
      <fieldset disabled={state === "saving"} className="disabled:opacity-70">
        <legend className="sr-only">Choose a cover thumbnail</legend>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {artworks.map((artwork) => {
            const isSelected = artwork.id === selectedId;
            return (
              <label key={artwork.id} className="group cursor-pointer">
                <input
                  type="radio"
                  name="cover-artwork"
                  value={artwork.id}
                  checked={isSelected}
                  onChange={() => setSelectedId(artwork.id)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "relative block aspect-square overflow-hidden rounded-xl border-2 bg-canvas-deep transition-all duration-200 ease-out",
                    "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-terracotta",
                    isSelected
                      ? "border-terracotta shadow-warm-xs"
                      : "border-transparent group-hover:border-border"
                  )}
                >
                  {/* Signed Storage URL for this artwork's real uploaded image */}
                  <img src={artwork.imageUrl} alt="" className="h-full w-full object-cover" />
                  {isSelected && (
                    <span
                      aria-hidden="true"
                      className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-canvas shadow-warm-xs"
                    >
                      <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
                        <path
                          d="M3.5 8.5l3 3 6-6.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </span>
                <span className="sr-only">{artwork.title || "Untitled"}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <SaveStatus
        className="border-t border-border/70 pt-5"
        state={displayState}
        onSave={handleSave}
        disabled={!isDirty}
        idleLabel="Save changes"
        errorMessage={error}
      />
    </section>
  );
}
