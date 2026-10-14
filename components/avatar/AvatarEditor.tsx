"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAvatarConfig } from "@/hooks/useAvatarConfig";
import { broadcastAvatarUpdate } from "@/lib/profile/avatarSync";
import { AvatarPreviewCanvas } from "./AvatarPreviewCanvas";
import { OptionGroup } from "./OptionGroup";
import { Button } from "@/components/ui/Button";
import {
  ACCESSORY_OPTIONS,
  BODY_COLOR_OPTIONS,
  BODY_SHAPE_OPTIONS,
  EXPRESSION_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HEAD_DECORATION_OPTIONS,
  SHOES_OPTIONS,
} from "@/types/avatar";
import type { AvatarConfiguration } from "@/types";

/**
 * A signed-in visitor's avatar lives on their account
 * (profiles.avatar_configuration -- the same field the museum, AccountMenu,
 * and public artist page all read), so when `accountConfig` is present,
 * saving here PATCHes /api/profile instead of writing to the localStorage
 * guest fallback (hooks/useAvatarConfig.ts). That guest fallback only
 * applies to signed-out visitors, and to a signed-in visitor whose account
 * config hasn't loaded here yet.
 */
export function AvatarEditor({ accountConfig }: { accountConfig: AvatarConfiguration | null }) {
  const hasAccount = accountConfig !== null;
  const { avatarConfig: guestAvatarConfig, setAvatarConfig: setGuestAvatarConfig, hydrated: guestHydrated } =
    useAvatarConfig();
  const savedConfig = accountConfig ?? guestAvatarConfig;
  const hydrated = hasAccount || guestHydrated;

  const [staged, setStaged] = useState<AvatarConfiguration>(savedConfig);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // The account config is already correct on the very first render (it came
  // from the server, deterministic for both SSR and first client render), so
  // only the guest/localStorage path needs to wait for a post-hydration
  // re-sync. Adjusting state during render (React's recommended pattern for
  // this) avoids an extra effect-driven re-render.
  const [syncedFromStorage, setSyncedFromStorage] = useState(hasAccount);
  if (hydrated && !syncedFromStorage) {
    setSyncedFromStorage(true);
    setStaged(savedConfig);
  }

  function update<K extends keyof AvatarConfiguration>(key: K, value: AvatarConfiguration[K]) {
    setStaged((prev) => ({ ...prev, [key]: value }));
    setSaveState("idle");
  }

  async function handleSave() {
    if (!hasAccount) {
      setGuestAvatarConfig(staged);
      setSaveState("saved");
      return;
    }

    setSaveState("saving");
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarConfiguration: staged }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Couldn't save your changes.");
        setSaveState("error");
        return;
      }
      // Tell the corner AccountMenu (and anything else showing this
      // account's avatar) right away, rather than waiting on a reload --
      // see lib/profile/avatarSync.ts for why that's otherwise necessary.
      broadcastAvatarUpdate(staged);
      setSaveState("saved");
      router.refresh();
    } catch {
      setError("Network error -- please try again.");
      setSaveState("error");
    }
  }

  function handleReset() {
    setStaged(savedConfig);
    setSaveState("idle");
  }

  const hasUnsavedChanges = JSON.stringify(staged) !== JSON.stringify(savedConfig);

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
          Drag to rotate. 
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saveState === "saving"}
            className="flex-1"
          >
            {saveState === "saving" ? "Saving…" : "Save avatar"}
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
          {saveState === "error" ? (
            <span className="text-dusty-red-dark">{error}</span>
          ) : saveState === "saved" && !hasUnsavedChanges ? (
            "Saved -- see you in the museum."
          ) : (
            " "
          )}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <OptionGroup
          legend="Character shape"
          name="bodyShape"
          options={BODY_SHAPE_OPTIONS}
          value={staged.bodyShape}
          onChange={(v) => update("bodyShape", v)}
        />
        <OptionGroup
          legend="Body color"
          name="skinTone"
          options={BODY_COLOR_OPTIONS}
          value={staged.skinTone}
          onChange={(v) => update("skinTone", v)}
        />
        <OptionGroup
          legend="Expression"
          name="expression"
          options={EXPRESSION_OPTIONS}
          value={staged.expression}
          onChange={(v) => update("expression", v)}
        />
        <OptionGroup
          legend="Head decoration"
          name="hairStyle"
          options={HEAD_DECORATION_OPTIONS}
          value={staged.hairStyle}
          onChange={(v) => update("hairStyle", v)}
        />
        <OptionGroup
          legend="Decoration color"
          name="hairColor"
          options={HAIR_COLOR_OPTIONS}
          value={staged.hairColor}
          onChange={(v) => update("hairColor", v)}
        />
        <OptionGroup
          legend="Feet color"
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
      </div>
    </div>
  );
}
