"use client";

import { useEffect, useRef, useState } from "react";
import { GALLERY_THEME_LIST, type GalleryThemeId } from "@/game/museum/themes";
import { MAX_ARTWORKS_PER_MUSEUM } from "@/lib/artwork/limits";
import { compressImage } from "@/lib/artwork/clientCompress";
import { OptionGroup } from "@/components/avatar/OptionGroup";
import { Button, LinkButton } from "@/components/ui/Button";
import { CopyLinkButton } from "@/components/museum/CopyLinkButton";
import { ArtworkDraftItem, type DraftArtwork } from "./ArtworkDraftItem";

function randomId() {
  return Math.random().toString(36).slice(2, 10);
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
  }

  const canSubmit =
    name.trim().length > 0 &&
    artworks.length > 0 &&
    artworks.every((a) => a.title.trim() && a.artist.trim());

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitState({ status: "uploading" });

    const formData = new FormData();
    formData.append(
      "meta",
      JSON.stringify({
        name: name.trim(),
        description: description.trim(),
        theme,
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
        <h2 className="mt-2 font-display text-3xl text-ink">{name}</h2>
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
        <p className="mx-auto mt-6 max-w-sm text-xs text-ink-muted">
          Prototype note: this museum is saved on this demo server, not in a production database
          -- it&apos;s a lightweight stand-in so the full experience works end to end.
        </p>
      </div>
    );
  }

  const isUploading = submitState.status === "uploading";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      <section className="flex flex-col gap-5 rounded-[1.75rem] border border-border/70 bg-surface p-6 shadow-warm-sm sm:p-8">
        <h2 className="font-display text-xl text-ink">About your museum</h2>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Museum name</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border bg-canvas px-3 py-2.5 text-ink outline-none focus-visible:border-terracotta"
            placeholder="e.g. Late Afternoon"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="resize-none rounded-lg border border-border bg-canvas px-3 py-2.5 text-ink outline-none focus-visible:border-terracotta"
            placeholder="What is this collection about?"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">
            Your name <span className="font-normal text-ink-muted">(fills in new pieces automatically)</span>
          </span>
          <input
            type="text"
            value={primaryArtist}
            onChange={(e) => setPrimaryArtist(e.target.value)}
            className="max-w-xs rounded-lg border border-border bg-canvas px-3 py-2.5 text-ink outline-none focus-visible:border-terracotta"
            placeholder="Your name"
          />
        </label>
        <OptionGroup
          legend="Gallery theme"
          name="theme"
          options={GALLERY_THEME_LIST.map((t) => ({ value: t.id, label: t.label, hex: t.wallColor }))}
          value={theme}
          onChange={setTheme}
        />
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-ink">Artwork</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {artworks.length} of {MAX_ARTWORKS_PER_MUSEUM} added
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={artworks.length >= MAX_ARTWORKS_PER_MUSEUM || isPreparingFiles}
          >
            {isPreparingFiles ? "Preparing…" : "Upload images"}
          </Button>
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
        </div>

        {uploadError && <p className="text-sm text-terracotta-dark">{uploadError}</p>}

        {artworks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-canvas-deep/50 p-10 text-center text-sm text-ink-muted">
            No artwork yet. Upload a few images to start building your gallery.
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {artworks.map((artwork, index) => (
              <ArtworkDraftItem
                key={artwork.id}
                artwork={artwork}
                index={index}
                onChange={updateArtwork}
                onRemove={removeArtwork}
              />
            ))}
          </ul>
        )}
      </section>

      {submitState.status === "error" && (
        <p role="alert" className="text-sm font-medium text-terracotta-dark">
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
