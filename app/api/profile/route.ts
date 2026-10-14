import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { updateMyProfile, type ProfilePatch } from "@/server/profilesRepository";
import {
  MAX_BIO_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  USERNAME_PATTERN,
} from "@/lib/profile/limits";
import {
  ACCESSORY_OPTIONS,
  BODY_COLOR_OPTIONS,
  BODY_SHAPE_OPTIONS,
  BOTTOM_OPTIONS,
  EXPRESSION_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HEAD_DECORATION_OPTIONS,
  SHOES_OPTIONS,
  TOP_OPTIONS,
} from "@/types/avatar";
import type { AvatarConfiguration } from "@/types";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isValidAvatarConfiguration(value: unknown): value is AvatarConfiguration {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    BODY_SHAPE_OPTIONS.some((o) => o.value === v.bodyShape) &&
    BODY_COLOR_OPTIONS.some((o) => o.value === v.skinTone) &&
    HEAD_DECORATION_OPTIONS.some((o) => o.value === v.hairStyle) &&
    HAIR_COLOR_OPTIONS.some((o) => o.value === v.hairColor) &&
    TOP_OPTIONS.some((o) => o.value === v.top) &&
    BOTTOM_OPTIONS.some((o) => o.value === v.bottom) &&
    SHOES_OPTIONS.some((o) => o.value === v.shoes) &&
    ACCESSORY_OPTIONS.some((o) => o.value === v.accessory) &&
    EXPRESSION_OPTIONS.some((o) => o.value === v.expression)
  );
}

/** Signed-in-user-only profile update -- display name, username, bio,
 * and/or avatar. Fields are patched independently (only keys present in the
 * body are validated/applied), matching PATCH /api/museums/[museumId]'s
 * convention. ProfileEditor (components/dashboard/profile/ProfileEditor.tsx)
 * relies on this to send a single combined request that includes only
 * whichever of "about you" / avatar is actually dirty. */
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;

  const patch: ProfilePatch = {};

  if (payload.displayName !== undefined) {
    const displayName = isString(payload.displayName)
      ? payload.displayName.trim().slice(0, MAX_DISPLAY_NAME_LENGTH)
      : "";
    if (!displayName) {
      return NextResponse.json({ error: "A display name is required." }, { status: 400 });
    }
    patch.displayName = displayName;
  }

  if (payload.username !== undefined) {
    const username = isString(payload.username) ? payload.username.trim().toLowerCase() : "";
    if (
      username.length < MIN_USERNAME_LENGTH ||
      username.length > MAX_USERNAME_LENGTH ||
      !USERNAME_PATTERN.test(username)
    ) {
      return NextResponse.json(
        {
          error: `Usernames must be ${MIN_USERNAME_LENGTH}-${MAX_USERNAME_LENGTH} characters: lowercase letters, numbers, and hyphens.`,
        },
        { status: 400 }
      );
    }
    patch.username = username;
  }

  if (payload.bio !== undefined) {
    patch.bio = isString(payload.bio) ? payload.bio.trim().slice(0, MAX_BIO_LENGTH) : "";
  }

  if (payload.avatarConfiguration !== undefined) {
    if (!isValidAvatarConfiguration(payload.avatarConfiguration)) {
      return NextResponse.json({ error: "Invalid avatar configuration." }, { status: 400 });
    }
    patch.avatarConfiguration = payload.avatarConfiguration;
  }

  if (payload.acceptsMessages !== undefined) {
    if (typeof payload.acceptsMessages !== "boolean") {
      return NextResponse.json({ error: "Invalid value for accepts messages." }, { status: 400 });
    }
    patch.acceptsMessages = payload.acceptsMessages;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const result = await updateMyProfile(user.id, patch);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
