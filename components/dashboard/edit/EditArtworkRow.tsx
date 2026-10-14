"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import type { Artwork } from "@/types";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { SaveStatus, type SaveStatusState } from "@/components/ui/SaveStatus";
import { ConfirmInline } from "@/components/ui/ConfirmInline";

type SaveState = "idle" | "saving" | "success" | "error";
type DeleteState = "idle" | "confirming" | "deleting" | "error";

/** Owner-only per-artwork editor: title/artist/year/medium/description/alt
 * text, each row with its own independent Save, plus its own Remove (with
 * an inline confirm step, same pattern as DeleteMuseumButton). Never edits
 * the image itself -- swapping the picture means removing this artwork and
 * adding a new one (see AddArtworkForm).
 *
 * Collapsed by default behind an explicit Edit/Done toggle (not an
 * implicitly-clickable card) so a museum with many pieces doesn't force a
 * long scroll of fully-open forms. All field state lives in this
 * component's own useState regardless of whether the fields are currently
 * rendered, so collapsing and reopening a row never loses an unsaved edit --
 * only the JSX for the fields is conditionally shown, this component
 * instance itself is never unmounted (React keys this list by artwork.id).
 */
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
  const fieldsId = useId();
  const [expanded, setExpanded] = useState(false);
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

  // Same rule as EditMuseumMetadataForm: hide a stale "Saved." the moment
  // the row is dirty again, without resetting `saveState` itself.
  const saveDisplayState: SaveStatusState = saveState === "success" && isDirty ? "idle" : saveState;

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
    <li className="rounded-2xl border border-border/70 bg-surface shadow-warm-xs">
      <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-canvas-deep">
          {/* Signed Storage URL for this artwork's real uploaded image */}
          <img src={artwork.imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Piece {artwork.displayOrder}
          </p>
          <p className="truncate font-heading text-base text-ink">{title.trim() || "Untitled"}</p>
          <p className="truncate text-sm text-ink-muted">{artist.trim() || "Unknown artist"}</p>
        </div>
        {isDirty && !expanded && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-antique-gold-dark">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-antique-gold" />
            Unsaved
          </span>
        )}
        <ConfirmInline
          triggerLabel="Remove"
          triggerDisabled={!canDelete}
          triggerDisabledTitle="A museum needs at least one artwork"
          confirming={deleteState === "confirming" || deleteState === "deleting"}
          busy={deleteState === "deleting"}
          onRequestConfirm={() => setDeleteState("confirming")}
          onCancel={() => setDeleteState("idle")}
          onConfirm={handleDelete}
          confirmPrompt="Remove this piece?"
          confirmingLabel="Removing…"
        />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={fieldsId}
          className="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-ink transition-colors duration-200 hover:border-terracotta-dark hover:text-terracotta-dark"
        >
          {expanded ? "Done" : "Edit"}
        </button>
      </div>
      {deleteError && <p className="px-4 pb-3 text-xs text-dusty-red-dark sm:px-5">{deleteError}</p>}

      {expanded && (
        <div id={fieldsId} className="flex flex-col gap-4 border-t border-border/70 px-4 pb-5 pt-4 sm:px-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField compact label="Title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextField compact label="Artist" type="text" value={artist} onChange={(e) => setArtist(e.target.value)} />
            <TextField compact label="Medium" type="text" value={medium} onChange={(e) => setMedium(e.target.value)} />
            <TextField compact label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <TextAreaField
            compact
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <TextAreaField
            compact
            label="Alt text"
            hint="(accessible image description)"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            rows={2}
          />
          <SaveStatus
            size="md"
            state={saveDisplayState}
            onSave={handleSave}
            disabled={!isDirty}
            errorMessage={saveError}
          />
        </div>
      )}
    </li>
  );
}
