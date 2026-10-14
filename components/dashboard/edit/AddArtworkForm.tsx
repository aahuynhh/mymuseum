"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/artwork/clientCompress";
import { MAX_ARTWORKS_PER_MUSEUM } from "@/lib/artwork/limits";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { SaveStatus } from "@/components/ui/SaveStatus";

type SubmitState = "idle" | "uploading" | "error";

/** Owner-only "add one artwork to this museum" -- same client-side
 * compress-before-upload step the create flow uses (components/create/
 * CreateMuseumForm.tsx), just for a single piece against an existing
 * museum. Posts to POST /api/museums/[museumId]/artworks, which validates,
 * uploads, inserts, and triggers a full relayout server-side. */
export function AddArtworkForm({ museumId, currentCount }: { museumId: string; currentCount: number }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [medium, setMedium] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  const atCap = currentCount >= MAX_ARTWORKS_PER_MUSEUM;
  const canSubmit = !atCap && title.trim() && artist.trim() && file;

  function handleFileSelected(selected: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !file) return;
    setState("uploading");
    setError(null);

    try {
      const { blob } = await compressImage(file);

      const formData = new FormData();
      formData.append(
        "meta",
        JSON.stringify({
          title: title.trim(),
          artist: artist.trim(),
          medium: medium.trim(),
          year: year ? Number(year) : undefined,
          description: description.trim(),
        })
      );
      formData.append("image", blob, "artwork.jpg");

      const res = await fetch(`/api/museums/${museumId}/artworks`, { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Couldn't add this artwork.");
        setState("error");
        return;
      }

      setTitle("");
      setArtist("");
      setMedium("");
      setDescription("");
      handleFileSelected(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setState("idle");
      router.refresh();
    } catch {
      setError("Network error -- please try again.");
      setState("error");
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-[1.75rem] border border-dashed border-border bg-canvas-deep/40 p-6 sm:p-8"
    >
      <div>
        <h2 className="font-heading text-xl text-ink">Add artwork</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {atCap
            ? `This museum has reached the ${MAX_ARTWORKS_PER_MUSEUM}-artwork limit.`
            : "Upload one more piece -- the gallery layout will adjust automatically."}
        </p>
      </div>

      {!atCap && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl border border-border/60 bg-canvas sm:w-32">
              {previewUrl ? (
                <img src={previewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-ink-muted">
                  No image
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
                className="text-sm text-ink-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink file:shadow-warm-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField compact label="Title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextField compact label="Artist" type="text" required value={artist} onChange={(e) => setArtist(e.target.value)} />
            <TextField compact label="Medium" type="text" value={medium} onChange={(e) => setMedium(e.target.value)} />
            <TextField compact label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <TextAreaField
            compact
            label="Description"
            hint="(also used as alt text)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />

          <SaveStatus
            state={state === "uploading" ? "saving" : state}
            onSave={() => formRef.current?.requestSubmit()}
            disabled={!canSubmit}
            idleLabel="Add artwork"
            savingLabel="Adding…"
            errorMessage={error}
          />
        </>
      )}
    </form>
  );
}
