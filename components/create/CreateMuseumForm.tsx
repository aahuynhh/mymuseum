"use client";

import { useEffect, useRef, useState } from "react";
import { GALLERY_THEME_LIST, type GalleryThemeId } from "@/game/museum/themes";
import { MAX_ARTWORKS_PER_MUSEUM } from "@/lib/artwork/limits";
import { compressImage } from "@/lib/artwork/clientCompress";
import { OptionGroup } from "@/components/avatar/OptionGroup";
import { Button, LinkButton } from "@/components/ui/Button";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { CopyLinkButton } from "@/components/museum/CopyLinkButton";
import { cn } from "@/utils/cn";
import { ArtworkDraftItem, type DraftArtwork } from "./ArtworkDraftItem";

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function UploadDropIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
      <path
        d="M16 20V6M12 10l4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 20v3a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Drag-and-drop + click-to-browse upload target. `compact` is used once
 * artwork already exists, so re-opening the picker doesn't require scrolling
 * back to a full-size zone above a potentially long draft list. Drag
 * handlers are additive to the existing click-to-browse `<input>` -- neither
 * replaces the other.
 */
function UploadDropzone({
  compact,
  disabled,
  preparing,
  onFiles,
  fileInputRef,
}: {
  compact: boolean;
  disabled: boolean;
  preparing: boolean;
  onFiles: (files: FileList | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  function openPicker() {
    if (!disabled) fileInputRef.current?.click();
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDraggingOver(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDraggingOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDraggingOver(false);
        if (!disabled) onFiles(event.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed text-center transition-colors duration-200",
        compact ? "flex-row justify-center gap-3 p-5 text-left" : "p-10",
        isDraggingOver ? "border-sage bg-sage/10" : "border-border bg-canvas-deep/50 hover:border-sage-dark/50 hover:bg-canvas-deep/70",
        disabled && "pointer-events-none cursor-not-allowed opacity-50"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink-muted shadow-warm-xs",
          compact ? "h-10 w-10" : "h-14 w-14"
        )}
      >
        <UploadDropIcon />
      </span>
      <div>
        <p className={cn("font-heading text-ink", compact ? "text-base" : "text-xl")}>
          {preparing ? "Preparing…" : "Drag images here, or click to browse"}
        </p>
        {!compact && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
            PNG, JPEG, WebP, or GIF -- up to {MAX_ARTWORKS_PER_MUSEUM} images.
          </p>
        )}
      </div>
    </div>
  );
}

type SubmitState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "error"; message: string }
  | { status: "success"; museumId: string };

export function CreateMuseumForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState<GalleryThemeId>("linen");
  const [artworks, setArtworks] = useState<DraftArtwork[]>([]);
  const [primaryArtist, setPrimaryArtist] = useState("");
  // Draft-local id of the artwork picked as cover thumbnail. `null` means
  // "no explicit pick yet" -- falls back to the first artwork, same default
  // the dashboard's CoverArtworkPicker uses post-creation.
  const [coverId, setCoverId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPreparingFiles, setIsPreparingFiles] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Object URLs (components/create/ArtworkDraftItem.tsx previews) aren't
  // released automatically -- revoke every one still outstanding on unmount
  // so a long create session doesn't leak memory. Kept in a ref (synced via
  // its own effect, never written during render) so the unmount cleanup
  // below only needs to run once and always sees the latest list.
  const artworksRef = useRef<DraftArtwork[]>([]);
  useEffect(() => {
    artworksRef.current = artworks;
  }, [artworks]);
  useEffect(() => {
    return () => {
      artworksRef.current.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    };
  }, []);

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const remaining = MAX_ARTWORKS_PER_MUSEUM - artworks.length;
    if (remaining <= 0) {
      setUploadError(`This prototype supports up to ${MAX_ARTWORKS_PER_MUSEUM} artworks per museum.`);
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    const currentYear = String(new Date().getFullYear());

    setIsPreparingFiles(true);
    for (const file of selected) {
      if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
        setUploadError("Please use a PNG, JPEG, WebP, or GIF image.");
        continue;
      }
      try {
        const { blob, imageAspectRatio } = await compressImage(file);
        setArtworks((prev) => [
          ...prev,
          {
            id: randomId(),
            title: "",
            artist: primaryArtist,
            description: "",
            medium: "",
            year: currentYear,
            imageBlob: blob,
            previewUrl: URL.createObjectURL(blob),
            imageAspectRatio,
          },
        ]);
      } catch {
        setUploadError(`Couldn't process "${file.name}". Try a different image.`);
      }
    }
    setIsPreparingFiles(false);
  }

  function updateArtwork(id: string, patch: Partial<DraftArtwork>) {
    setArtworks((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function removeArtwork(id: string) {
    setArtworks((prev) => {
      const removed = prev.find((a) => a.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
    setCoverId((prev) => (prev === id ? null : prev));
  }

  const canSubmit =
    name.trim().length > 0 &&
    artworks.length > 0 &&
    artworks.every((a) => a.title.trim() && a.artist.trim());

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitState({ status: "uploading" });

    const coverArtworkIndex = coverId ? artworks.findIndex((a) => a.id === coverId) : -1;

    const formData = new FormData();
    formData.append(
      "meta",
      JSON.stringify({
        name: name.trim(),
        description: description.trim(),
        theme,
        coverArtworkIndex: coverArtworkIndex >= 0 ? coverArtworkIndex : undefined,
        artworks: artworks.map((a) => ({
          title: a.title.trim(),
          artist: a.artist.trim(),
          description: a.description.trim(),
          medium: a.medium.trim(),
          year: a.year ? Number(a.year) : undefined,
        })),
      })
    );
    artworks.forEach((a, i) => {
      formData.append(`image-${i}`, a.imageBlob, `artwork-${i}.jpg`);
    });

    try {
      const res = await fetch("/api/museums", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitState({ status: "error", message: data?.error || "Something went wrong." });
        return;
      }
      setSubmitState({ status: "success", museumId: data.museumId });
    } catch {
      setSubmitState({ status: "error", message: "Network error -- please try again." });
    }
  }

  if (submitState.status === "success") {
    const museumPath = `/museum/${submitState.museumId}`;
    return (
      <div className="rounded-[1.75rem] border border-border/70 bg-surface p-8 text-center shadow-warm-sm sm:p-12">
        <p className="font-display text-sm italic text-terracotta-dark">Your museum is ready</p>
        <h2 className="mt-2 font-heading text-3xl text-ink">{name}</h2>
        <p className="mx-auto mt-3 max-w-md text-ink-muted">
          It&apos;s live at a shareable link. Anyone who opens it can walk through it and see who
          else is visiting, just like the demo museum.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <LinkButton href={museumPath} size="lg">
            Enter Museum
          </LinkButton>
          <CopyLinkButton path={museumPath} />
        </div>
      </div>
    );
  }

  const isUploading = submitState.status === "uploading";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      <section className="flex flex-col gap-5 rounded-[1.75rem] border border-border/70 bg-surface p-6 shadow-warm-sm sm:p-8">
        <h2 className="font-heading text-xl text-ink">About your museum</h2>
        <TextField
          label="Museum name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Late Afternoon"
        />
        <TextAreaField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What is this collection about?"
        />
        <TextField
          label="Your name"
          hint="(fills in new pieces automatically)"
          type="text"
          value={primaryArtist}
          onChange={(e) => setPrimaryArtist(e.target.value)}
          labelClassName="max-w-xs"
          placeholder="Your name"
        />
        <OptionGroup
          legend="Gallery theme"
          name="theme"
          options={GALLERY_THEME_LIST.map((t) => ({ value: t.id, label: t.label, hex: t.wallColor }))}
          value={theme}
          onChange={setTheme}
        />
      </section>

      <section className="flex flex-col gap-5">
        <div>
          <h2 className="font-heading text-xl text-ink">Artwork</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {artworks.length} of {MAX_ARTWORKS_PER_MUSEUM} added
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="sr-only"
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.target.value = "";
          }}
        />

        {uploadError && <p className="text-sm text-dusty-red-dark">{uploadError}</p>}

        {artworks.length === 0 ? (
          <UploadDropzone
            compact={false}
            disabled={isPreparingFiles}
            preparing={isPreparingFiles}
            onFiles={handleFilesSelected}
            fileInputRef={fileInputRef}
          />
        ) : (
          <>
            <ul className="flex flex-col gap-4">
              {artworks.map((artwork, index) => (
                <ArtworkDraftItem
                  key={artwork.id}
                  artwork={artwork}
                  index={index}
                  isCover={(coverId ?? artworks[0]?.id) === artwork.id}
                  onChange={updateArtwork}
                  onRemove={removeArtwork}
                  onSetCover={setCoverId}
                />
              ))}
            </ul>
            <UploadDropzone
              compact
              disabled={artworks.length >= MAX_ARTWORKS_PER_MUSEUM || isPreparingFiles}
              preparing={isPreparingFiles}
              onFiles={handleFilesSelected}
              fileInputRef={fileInputRef}
            />
          </>
        )}
      </section>

      {submitState.status === "error" && (
        <p role="alert" className="text-sm font-medium text-dusty-red-dark">
          {submitState.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-border/70 pt-6">
        <Button type="submit" size="lg" disabled={!canSubmit || isUploading}>
          {isUploading ? "Uploading your museum…" : "Create My Museum"}
        </Button>
        {!canSubmit && !isUploading && (
          <p className="text-xs text-ink-muted">
            Add a museum name and at least one artwork (with a title and artist) to continue.
          </p>
        )}
      </div>
    </form>
  );
}
