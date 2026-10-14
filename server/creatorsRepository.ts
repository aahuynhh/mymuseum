import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCoverImageUrls, type PublicMuseumSummary } from "./museumsRepository";
import { DEMO_MUSEUM, DEMO_MUSEUM_OWNER_ID } from "@/data/museum";
import { DEMO_ARTWORKS } from "@/data/artworks";
import type { AvatarConfiguration } from "@/types";

// Fixed so Artlane sorts by date like any other museum instead of always
// pinning to one end of a list -- see demoMuseumSummary below.
const DEMO_MUSEUM_CREATED_AT = "2026-01-01T00:00:00.000Z";

/** Artlane's PublicMuseumSummary shape, attributed to whichever real
 * profile currently owns DEMO_MUSEUM_OWNER_ID -- a pure function of that
 * profile's live username/display name, so a rename in ProfileEditor is
 * reflected here automatically rather than needing a second hardcoded
 * value kept in sync by hand. */
function demoMuseumSummary(creatorUsername: string, creatorDisplayName: string): PublicMuseumSummary {
  return {
    id: DEMO_MUSEUM.id,
    name: DEMO_MUSEUM.name,
    description: DEMO_MUSEUM.description,
    createdAt: DEMO_MUSEUM_CREATED_AT,
    isPublished: true,
    coverImageUrl: DEMO_ARTWORKS[0]?.imageUrl ?? null,
    creatorUsername,
    creatorDisplayName,
  };
}

/** Artlane folded into /explore -- null if DEMO_MUSEUM_OWNER_ID doesn't
 * resolve to a real profile (e.g. a fresh database before that account has
 * signed up), so /explore degrades gracefully instead of showing a broken
 * attribution. */
export async function getDemoMuseumSummary(): Promise<PublicMuseumSummary | null> {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", DEMO_MUSEUM_OWNER_ID)
    .maybeSingle();

  if (error || !profile) return null;
  return demoMuseumSummary(profile.username, profile.display_name);
}

export interface PublicCreatorSummary {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  museumCount: number;
  avatarConfiguration: AvatarConfiguration;
}

/**
 * Every creator with at least one published museum -- the roster for
 * /explore/artists -- plus, always, whichever account owns
 * DEMO_MUSEUM_OWNER_ID (Artlane counts toward their museumCount even if
 * they have no real published museums of their own). A creator with zero
 * published museums and no Artlane attribution never appears here,
 * mirroring how getPublishedMuseumSummaries only surfaces published rows.
 */
export async function getPublicCreators(): Promise<PublicCreatorSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("museums").select("owner_id").eq("is_published", true);

  if (error) return [];

  const museumCountByOwner = new Map<string, number>();
  for (const row of data ?? []) {
    museumCountByOwner.set(row.owner_id, (museumCountByOwner.get(row.owner_id) ?? 0) + 1);
  }
  if (!museumCountByOwner.has(DEMO_MUSEUM_OWNER_ID)) {
    museumCountByOwner.set(DEMO_MUSEUM_OWNER_ID, 0);
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_configuration")
    .in("id", [...museumCountByOwner.keys()]);

  if (profilesError || !profiles) return [];

  return profiles
    .map((profile) => {
      const isDemoOwner = profile.id === DEMO_MUSEUM_OWNER_ID;
      return {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        bio: profile.bio,
        museumCount: (museumCountByOwner.get(profile.id) ?? 0) + (isDemoOwner ? 1 : 0),
        avatarConfiguration: profile.avatar_configuration as AvatarConfiguration,
      };
    })
    .sort((a, b) => b.museumCount - a.museumCount);
}

export interface PublicCreator {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarConfiguration: AvatarConfiguration;
  acceptsMessages: boolean;
}

/**
 * A single creator's public page (/artist/[username]): their profile plus
 * every museum of theirs that's published, with Artlane folded in (and
 * re-sorted alongside the rest by date) if this is DEMO_MUSEUM_OWNER_ID.
 * Returns null only if the username doesn't resolve to a real profile at
 * all -- unlike the /explore/artists listing, a creator's own page exists
 * and is reachable by direct link the moment they sign up, with
 * `museums: []` until they publish something (see hasPublicCreator, which
 * proxy.ts uses for the same "does this route resolve to something real"
 * check).
 */
export async function getCreatorMuseums(
  username: string
): Promise<{ creator: PublicCreator; museums: PublicMuseumSummary[] } | null> {
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_configuration, accepts_messages")
    .eq("username", username)
    .maybeSingle();

  if (profileError || !profile) return null;

  const { data: museumRows, error: museumsError } = await supabase
    .from("museums")
    .select("id, name, description, created_at, is_published, cover_artwork_id")
    .eq("owner_id", profile.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (museumsError) return null;

  const coverImageUrls = await getCoverImageUrls(
    supabase,
    (museumRows ?? []).map((row) => ({ id: row.id, coverArtworkId: row.cover_artwork_id }))
  );

  const museums: PublicMuseumSummary[] = (museumRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    isPublished: row.is_published,
    coverImageUrl: coverImageUrls.get(row.id) ?? null,
    creatorUsername: profile.username,
    creatorDisplayName: profile.display_name,
  }));

  if (profile.id === DEMO_MUSEUM_OWNER_ID) {
    museums.push(demoMuseumSummary(profile.username, profile.display_name));
    museums.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return {
    creator: {
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      bio: profile.bio,
      avatarConfiguration: profile.avatar_configuration as AvatarConfiguration,
      acceptsMessages: profile.accepts_messages,
    },
    museums,
  };
}

/** Cheap existence check for proxy.ts's pre-render 404 rewrite -- same
 * "does this route resolve to something real" role hasMuseum plays for
 * /museum/:id. Any real profile counts, not just ones with a published
 * museum -- see getCreatorMuseums' doc comment. */
export async function hasPublicCreator(username: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  return !error && profile !== null;
}
