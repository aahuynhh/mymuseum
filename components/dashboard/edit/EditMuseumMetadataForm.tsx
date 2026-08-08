"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GALLERY_THEME_LIST, type GalleryThemeId } from "@/game/museum/themes";
import { OptionGroup } from "@/components/avatar/OptionGroup";
import { Button } from "@/components/ui/Button";

type SaveState = "idle" | "saving" | "success" | "error";

/** Owner-only museum name/description/theme editor. Its own independent
 * Save -- separate from the publish toggle and every artwork row -- so a
 * failed save here never blocks or gets blocked by anything else on the
 * page. The museum's id/URL is never part of this form and never changes. */
export function EditMuseumMetadataForm({
  museumId,
  initialName,
  initialDescription,
  initialTheme,
}: {
  museumId: string;
  initialName: string;
  initialDescription: string;
  initialTheme: GalleryThemeId;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [theme, setTheme] = useState<GalleryThemeId>(initialTheme);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const isDirty = name !== initialName || description !== initialDescription || theme !== initialTheme;

  async function handleSave() {
    if (!name.trim()) {
      setError("A museum name is required.");
      setState("error");
      return;
    }
    setState("saving");
    setError(null);
    try {
      const res = await fetch(`/api/museums/${museumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), theme }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Couldn't save your changes.");
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
      <h2 className="font-display text-xl text-ink">About your museum</h2>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Museum name</span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-border bg-canvas px-3 py-2.5 text-ink outline-none focus-visible:border-terracotta"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="resize-none rounded-lg border border-border bg-canvas px-3 py-2.5 text-ink outline-none focus-visible:border-terracotta"
        />
      </label>
      <OptionGroup
        legend="Gallery theme"
        name="theme"
        options={GALLERY_THEME_LIST.map((t) => ({ value: t.id, label: t.label, hex: t.wallColor }))}
        value={theme}
        onChange={setTheme}
      />
      <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-5">
        <Button type="button" onClick={handleSave} disabled={!isDirty || state === "saving"}>
          {state === "saving" ? "Saving…" : "Save changes"}
        </Button>
        {state === "success" && !isDirty && <p className="text-sm text-sage-dark">Saved.</p>}
        {error && (
          <p role="alert" className="text-sm font-medium text-terracotta-dark">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
