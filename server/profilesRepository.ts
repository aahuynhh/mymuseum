import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AvatarConfiguration } from "@/types";

export interface MyProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarConfiguration: AvatarConfiguration;
  acceptsMessages: boolean;
}

/** Owner-scoped read for the profile edit page (app/dashboard/profile).
 * Profiles are public-read via RLS, but this is always called with the
 * current session's own id, never a route param -- "my profile" is
 * whoever's signed in, not whoever's URL you happen to be on. */
export async function getMyProfile(userId: string): Promise<MyProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_configuration, accepts_messages")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    bio: data.bio,
    avatarConfiguration: data.avatar_configuration as AvatarConfiguration,
    acceptsMessages: data.accepts_messages,
  };
}

/** Museum Mail's "can a new note reach this person" check -- called from
 * server/messagesRepository.ts, and from a museum page when deciding
 * whether to render the "Leave a note"/"Message artist" entry points at
 * all. Fails open (true) on error or a missing row, matching the
 * codebase's fail-toward-existing-behavior instinct elsewhere (e.g.
 * museums.is_published defaulting true) -- a read hiccup here should never
 * silently cut an artist off from messages they never opted out of. */
export async function getAcceptsMessages(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("accepts_messages")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return true;
  return data.accepts_messages;
}

export interface ProfilePatch {
  displayName?: string;
  username?: string;
  bio?: string;
  avatarConfiguration?: AvatarConfiguration;
  acceptsMessages?: boolean;
}

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

/**
 * Owner-only profile update -- RLS's `profiles_update_own` (id = auth.uid())
 * is the real enforcement; `userId` here is only used to target the row.
 * Username collisions surface as a Postgres unique-violation (code 23505,
 * from the `username text ... unique` constraint in 0001_init.sql) --
 * caught here and turned into a field-specific message instead of a raw
 * 500, the one failure mode that's actually expected in normal use (someone
 * else already has that name).
 */
export async function updateMyProfile(userId: string, patch: ProfilePatch): Promise<UpdateProfileResult> {
  const supabase = await createClient();

  const update: Record<string, unknown> = {};
  if (patch.displayName !== undefined) update.display_name = patch.displayName;
  if (patch.username !== undefined) update.username = patch.username;
  if (patch.bio !== undefined) update.bio = patch.bio;
  if (patch.avatarConfiguration !== undefined) update.avatar_configuration = patch.avatarConfiguration;
  if (patch.acceptsMessages !== undefined) update.accepts_messages = patch.acceptsMessages;

  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await supabase.from("profiles").update(update).eq("id", userId);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That username is already taken." };
    }
    console.error("[profiles] failed to update profile:", error.message, userId);
    return { ok: false, error: "Couldn't save your changes." };
  }

  return { ok: true };
}
