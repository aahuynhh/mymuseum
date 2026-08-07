"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAvatarConfig } from "@/hooks/useAvatarConfig";
import { AvatarPreviewCanvas } from "./AvatarPreviewCanvas";
import { OptionGroup } from "./OptionGroup";
import { Button } from "@/components/ui/Button";
import {
  ACCESSORY_OPTIONS,
  BOTTOM_OPTIONS,
  DEFAULT_AVATAR_CONFIGURATION,
  HAIR_COLOR_OPTIONS,
  HAIR_STYLE_OPTIONS,
  SHOES_OPTIONS,
  SKIN_TONE_OPTIONS,
  TOP_OPTIONS,
} from "@/types/avatar";
import type { AvatarConfiguration } from "@/types";

export function AvatarEditor() {
  const { avatarConfig, setAvatarConfig, hydrated } = useAvatarConfig();
  const [staged, setStaged] = useState<AvatarConfiguration>(DEFAULT_AVATAR_CONFIGURATION);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const router = useRouter();

  // Once the persisted avatar has hydrated from localStorage, seed the
  // editable "staged" copy from it. Adjusting state during render (React's
  // recommended pattern for this) avoids an extra effect-driven re-render.
  const [syncedFromStorage, setSyncedFromStorage] = useState(false);
  if (hydrated && !syncedFromStorage) {
    setSyncedFromStorage(true);
    setStaged(avatarConfig);
  }

  function update<K extends keyof AvatarConfiguration>(key: K, value: AvatarConfiguration[K]) {
    setStaged((prev) => ({ ...prev, [key]: value }));
    setSaveState("idle");
  }

  function handleSave() {
    setAvatarConfig(staged);
    setSaveState("saved");
  }

  function handleReset() {
    setStaged(avatarConfig);
    setSaveState("idle");
  }

  const hasUnsavedChanges = JSON.stringify(staged) !== JSON.stringify(avatarConfig);

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ink-muted">
        Loading your avatar…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[380px_1fr]">
      <div className="lg:sticky lg:top-8 lg:self-start">
        <AvatarPreviewCanvas config={staged} />
        <p className="mt-3 text-center text-xs text-ink-muted">
          Drag to rotate. This is exactly how others will see you in the museum.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Button onClick={handleSave} disabled={!hasUnsavedChanges} className="flex-1">
            Save avatar
          </Button>
          <Button
            onClick={handleReset}
            variant="secondary"
            disabled={!hasUnsavedChanges}
            className="flex-1"
          >
            Reset changes
          </Button>
        </div>
        <p role="status" className="mt-2 text-center text-xs text-sage">
          {saveState === "saved" && !hasUnsavedChanges ? "Saved -- see you in the museum." : " "}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <OptionGroup
          legend="Skin tone"
          name="skinTone"
          options={SKIN_TONE_OPTIONS}
          value={staged.skinTone}
          onChange={(v) => update("skinTone", v)}
        />
        <OptionGroup
          legend="Hairstyle"
          name="hairStyle"
          options={HAIR_STYLE_OPTIONS}
          value={staged.hairStyle}
          onChange={(v) => update("hairStyle", v)}
        />
        <OptionGroup
          legend="Hair color"
          name="hairColor"
          options={HAIR_COLOR_OPTIONS}
          value={staged.hairColor}
          onChange={(v) => update("hairColor", v)}
        />
        <OptionGroup
          legend="Top"
          name="top"
          options={TOP_OPTIONS}
          value={staged.top}
          onChange={(v) => update("top", v)}
        />
        <OptionGroup
          legend="Bottom"
          name="bottom"
          options={BOTTOM_OPTIONS}
          value={staged.bottom}
          onChange={(v) => update("bottom", v)}
        />
        <OptionGroup
          legend="Shoes"
          name="shoes"
          options={SHOES_OPTIONS}
          value={staged.shoes}
          onChange={(v) => update("shoes", v)}
        />
        <OptionGroup
          legend="Accessory"
          name="accessory"
          options={ACCESSORY_OPTIONS.map((o) => ({ ...o }))}
          value={staged.accessory}
          onChange={(v) => update("accessory", v)}
        />

        <div className="mt-2 flex flex-wrap gap-3 border-t border-border/70 pt-6">
          <Button variant="secondary" onClick={() => router.push("/museum/demo-artist")}>
            Enter demo museum
          </Button>
        </div>
      </div>
    </div>
  );
}
