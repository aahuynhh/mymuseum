"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Artwork } from "@/types";
import { Button } from "@/components/ui/Button";

type SaveState = "idle" | "saving" | "success" | "error";
type DeleteState = "idle" | "confirming" | "deleting" | "error";

/** Owner-only per-artwork editor: title/artist/year/medium/description/alt
 * text, each row with its own independent Save, plus its own Remove (with
 * an inline confirm step, same pattern as DeleteMuseumButton). Never edits
 * the image itself -- swapping the picture means removing this artwork and
 * adding a new one (see AddArtworkForm). */
export function EditArtworkRow({
  museumId,
  artwork,
  canDelete,
}: {
  museumId: string;
  artwork: Artwork;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(artwork.title);
  const [artist, setArtist] = useState(artwork.artist);
  const [year, setYear] = useState(String(artwork.year));
  const [medium, setMedium] = useState(artwork.medium);
  const [description, setDescription] = useState(artwork.description);
  const [altText, setAltText] = useState(artwork.altText);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>("idle");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isDirty =
    title !== artwork.title ||
    artist !== artwork.artist ||
    year !== String(artwork.year) ||
    medium !== artwork.medium ||
    description !== artwork.description ||
    altText !== artwork.altText;

  async function handleSave() {
    if (!title.trim() || !artist.trim()) {
      setSaveError("A title and an artist name are required.");
      setSaveState("error");
      return;
    }
    setSaveState("saving");
    setSaveError(null);
    try {
      const res = await fetch(`/api/museums/${museumId}/artworks/${artwork.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          artist: artist.trim(),
          year: Number(year) || artwork.year,
          medium: medium.trim(),
          description: description.trim(),
          altText: altText.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data?.error || "Couldn't save this artwork.");
        setSaveState("error");
        return;
      }
      setSaveState("success");
      router.refresh();
    } catch {
      setSaveError("Network error -- please try again.");
      setSaveState("error");
    }
  }

  async function handleDelete() {
    setDeleteState("deleting");
    setDeleteError(null);
    try {
      const res = await fetch(`/api/museums/${museumId}/artworks/${artwork.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data?.error || "Couldn't remove this artwork.");
        setDeleteState("error");
        return;
      }
      router.refresh();
    } catch {
      setDeleteError("Network error -- please try again.");
      setDeleteState("error");
    }
  }

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-surface p-4 shadow-warm-xs sm:flex-row sm:p-5">
      <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl border border-border/60 bg-canvas-deep sm:w-32">
        {/* Signed Storage URL for this artwork's real uploaded image */}
        <img src={artwork.imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Piece {artwork.displayOrder}
          </p>
          {deleteState === "confirming" || deleteState === "deleting" ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted">Remove this piece?</span>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setDeleteState("idle")}
                disabled={deleteState === "deleting"}
                className="px-2.5 py-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleDelete}
                disabled={deleteState === "deleting"}
                className="px-2.5 py-1 text-xs"
              >
                {deleteState === "deleting" ? "Removing…" : "Confirm"}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDeleteState("confirming")}
              disabled={!canDelete}
              title={canDelete ? undefined : "A museum needs at least one artwork"}
              className="text-xs font-medium text-ink-muted underline-offset-2 transition-colors hover:text-terracotta-dark hover:underline disabled:opacity-40 disabled:hover:no-underline"
            >
              Remove
            </button>
          )}
        </div>
        {deleteError && <p className="text-xs text-terracotta-dark">{deleteError}</p>}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus-visible:border-terracotta"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">Artist</span>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus-visible:border-terracotta"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">Medium</span>
            <input
              type="text"
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus-visible:border-terracotta"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">Year</span>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus-visible:border-terracotta"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="resize-none rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus-visible:border-terracotta"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">
            Alt text <span className="font-normal text-ink-muted">(accessible image description)</span>
          </span>
          <textarea
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            rows={2}
            className="resize-none rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus-visible:border-terracotta"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="md" onClick={handleSave} disabled={!isDirty || saveState === "saving"}>
            {saveState === "saving" ? "Saving…" : "Save"}
          </Button>
          {saveState === "success" && !isDirty && <p className="text-sm text-sage-dark">Saved.</p>}
          {saveError && (
            <p role="alert" className="text-sm font-medium text-terracotta-dark">
              {saveError}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
