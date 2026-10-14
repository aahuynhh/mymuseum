"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AvatarPreviewCanvas } from "@/components/avatar/AvatarPreviewCanvas";
import { OptionGroup } from "@/components/avatar/OptionGroup";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { Button, LinkButton } from "@/components/ui/Button";
import { MAX_BIO_LENGTH, MAX_DISPLAY_NAME_LENGTH } from "@/lib/profile/limits";
import { broadcastAvatarUpdate } from "@/lib/profile/avatarSync";
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

type SaveState = "idle" | "saving" | "success" | "error";

/**
 * One editor, one Save Changes action -- but "About you" and "Customize
 * character" still save through the same two logical pieces they always did
 * (displayName/username/bio vs. avatarConfiguration). Both go through the
 * same PATCH /api/profile partial-patch endpoint, so a single save just
 * sends whichever of the two groups is actually dirty in one request rather
 * than firing two independent fetches -- see app/api/profile/route.ts,
 * which already treats the body as "only the keys present are applied."
 */
export function ProfileEditor({
  initialDisplayName,
  initialUsername,
  initialBio,
  initialConfig,
}: {
  initialDisplayName: string;
  initialUsername: string;
  initialBio: string;
  initialConfig: AvatarConfiguration;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfiguration>(initialConfig);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const profileDirty =
    displayName !== initialDisplayName || username !== initialUsername || bio !== initialBio;
  const avatarDirty = JSON.stringify(avatarConfig) !== JSON.stringify(initialConfig);
  const isDirty = profileDirty || avatarDirty;

  // Once a save lands and router.refresh() catches the local state up to
  // the freshly-fetched initial* props, isDirty flips false while state is
  // still "success" -- that's the moment to show a brief confirmation, then
  // clear it so the bar doesn't linger forever.
  useEffect(() => {
    if (state === "success" && !isDirty) {
      const timer = setTimeout(() => setState("idle"), 2600);
      return () => clearTimeout(timer);
    }
  }, [state, isDirty]);

  function updateAvatar<K extends keyof AvatarConfiguration>(key: K, value: AvatarConfiguration[K]) {
    setAvatarConfig((prev) => ({ ...prev, [key]: value }));
    setState("idle");
  }

  async function handleSave() {
    if (!displayName.trim()) {
      setError("A display name is required.");
      setState("error");
      return;
    }
    if (!username.trim()) {
      setError("A username is required.");
      setState("error");
      return;
    }
    setState("saving");
    setError(null);
    try {
      const patch: { displayName?: string; username?: string; bio?: string; avatarConfiguration?: AvatarConfiguration } = {};
      if (profileDirty) {
        patch.displayName = displayName.trim();
        patch.username = username.trim().toLowerCase();
        patch.bio = bio.trim();
      }
      if (avatarDirty) {
        patch.avatarConfiguration = avatarConfig;
      }
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Couldn't save your changes.");
        setState("error");
        return;
      }
      if (avatarDirty) broadcastAvatarUpdate(avatarConfig);
      setState("success");
      router.refresh();
    } catch {
      setError("Network error -- please try again.");
      setState("error");
    }
  }

  const showSuccess = state === "success" && !isDirty;
  const barVisible = isDirty || state === "saving" || state === "error" || showSuccess;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr] lg:items-start lg:gap-12">
      {/* top-24 (96px) clears the platform HUD's fixed corner controls
          (top-6 offset + an ~44px pill), so the card sticks fully below
          them instead of scrolling partway under their blurred background. */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[1.75rem] border border-border/70 bg-surface p-6 text-center shadow-warm-xs">
          <AvatarPreviewCanvas config={avatarConfig} />
          <h2 className="mt-5 truncate font-heading text-xl text-ink">{displayName || "Unnamed artist"}</h2>
          <p className="mt-0.5 truncate text-sm text-ink-muted">@{username || "username"}</p>
          <LinkButton
            href={`/artist/${initialUsername}`}
            variant="secondary"
            className="mt-5 w-full justify-center"
          >
            View public page
          </LinkButton>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-5">
          <div>
            <h2 className="font-heading text-xl text-ink">About you</h2>
            <p className="mt-1 text-sm text-ink-muted">The basics people see first.</p>
          </div>
          <TextField
            label="Display name"
            type="text"
            required
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <TextField
            label="Username"
            hint={`-- your public profile: /artist/${username || "…"}`}
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
          />
          <TextAreaField
            label="Bio"
            hint="(optional)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={MAX_BIO_LENGTH}
          />
        </section>

        <div className="border-t border-border/70" />

        <section className="flex flex-col gap-6">
          <div>
            <h2 className="font-heading text-xl text-ink">Customize character</h2>
            <p className="mt-1 text-sm text-ink-muted">Your look across MyMuseum -- updates live as you go.</p>
          </div>
          <OptionGroup
            legend="Character shape"
            name="bodyShape"
            options={BODY_SHAPE_OPTIONS}
            value={avatarConfig.bodyShape}
            onChange={(v) => updateAvatar("bodyShape", v)}
          />
          <OptionGroup
            legend="Body color"
            name="skinTone"
            variant="swatch"
            options={BODY_COLOR_OPTIONS}
            value={avatarConfig.skinTone}
            onChange={(v) => updateAvatar("skinTone", v)}
          />
          <OptionGroup
            legend="Expression"
            name="expression"
            options={EXPRESSION_OPTIONS}
            value={avatarConfig.expression}
            onChange={(v) => updateAvatar("expression", v)}
          />
          <OptionGroup
            legend="Head decoration"
            name="hairStyle"
            options={HEAD_DECORATION_OPTIONS}
            value={avatarConfig.hairStyle}
            onChange={(v) => updateAvatar("hairStyle", v)}
          />
          <OptionGroup
            legend="Decoration color"
            name="hairColor"
            variant="swatch"
            options={HAIR_COLOR_OPTIONS}
            value={avatarConfig.hairColor}
            onChange={(v) => updateAvatar("hairColor", v)}
          />
          <OptionGroup
            legend="Feet color"
            name="shoes"
            variant="swatch"
            options={SHOES_OPTIONS}
            value={avatarConfig.shoes}
            onChange={(v) => updateAvatar("shoes", v)}
          />
          <OptionGroup
            legend="Accessory"
            name="accessory"
            options={ACCESSORY_OPTIONS.map((o) => ({ ...o }))}
            value={avatarConfig.accessory}
            onChange={(v) => updateAvatar("accessory", v)}
          />
        </section>

        <AnimatePresence>
          {barVisible && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="sticky bottom-6 z-10 flex flex-wrap items-center justify-between gap-3 rounded-full border border-border/70 bg-surface/95 px-5 py-3 shadow-warm-md backdrop-blur"
            >
              <p className="text-sm">
                {state === "saving" && <span className="text-ink-muted">Saving changes…</span>}
                {state === "error" && (
                  <span role="alert" className="font-medium text-dusty-red-dark">
                    {error}
                  </span>
                )}
                {showSuccess && <span className="font-medium text-sage-dark">All changes saved.</span>}
                {isDirty && state !== "saving" && state !== "error" && (
                  <span className="font-medium text-terracotta-dark">Unsaved changes</span>
                )}
              </p>
              {(isDirty || state === "error") && (
                <Button type="button" variant="primary" onClick={handleSave} disabled={state === "saving"}>
                  {state === "saving" ? "Saving…" : "Save changes"}
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
