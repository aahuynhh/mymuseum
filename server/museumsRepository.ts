import "server-only";
import type { Museum, RoomBounds, WallOpening } from "@/types";
import type { GalleryThemeId } from "@/game/museum/themes";
import { createClient } from "@/lib/supabase/server";
import { getArtworksForMuseum } from "./artworksRepository";
import { deleteArtworkFolder, getSignedArtworkUrls } from "@/lib/artwork/storage";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Postgres-backed store for user-created museums (replaces the old
 * file-backed `server/museumStore.ts`). Every call goes through a
 * request-scoped Supabase client authenticated as the current user's own
 * session, so Row Level Security -- not this module -- is what actually
 * enforces "only the owner can write their museum" and "only a published
 * museum, or the owner's own museum, can be read." See
 * supabase/migrations/0001_init.sql, 0002_museum_visibility.sql, and
 * 0003_artwork_storage.sql for the tables and policies. Because RLS filters
 * rows before this module ever sees them, `getMuseumById`/`hasMuseum` need
 * no visibility-specific logic here: a private museum requested by anyone
 * but its owner comes back exactly like a museum that doesn't exist.
 *
 * Phase 2: artwork now lives in a separate `artworks` table + private
 * Storage bucket, not embedded as base64 in `museums.artworks`. That jsonb
 * column still exists on disk (staged migration -- see
 * 0003_artwork_storage.sql's header comment) but is never read or written
 * here; `rows.artworks` is intentionally left out of every select below.
 */

interface MuseumRow {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  spawn_point: Museum["spawnPoint"];
  rooms: Museum["rooms"];
  opening_connectors: Museum["openingConnectors"];
}

const MUSEUM_COLUMNS = "id, owner_id, name, description, spawn_point, rooms, opening_connectors";

async function rowToMuseum(row: MuseumRow): Promise<Museum> {
  const artworks = await getArtworksForMuseum(row.id);
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    artworks,
    spawnPoint: row.spawn_point,
    rooms: row.rooms,
    openingConnectors: row.opening_connectors,
  };
}

export interface MuseumSummary {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  isPublished: boolean;
  /** First artwork's signed image URL (by display order), for the
   * dashboard's museum card thumbnail -- resolved through the same private
   * `artwork-images` bucket + short-lived signed URL every other artwork
   * image goes through (see lib/artwork/storage.ts). `null` if the museum
   * has no artwork yet. */
  coverImageUrl: string | null;
}

/**
 * Lightweight listing for the dashboard -- selects only the columns a list
 * view needs and filters by `ownerId`. Callers must pass an id derived from
 * the current server-side session (e.g. `getCurrentUser()`), never from
 * client input -- this filter is what keeps the dashboard scoped to one
 * user's museums. RLS separately guarantees the owner can read all of their
 * own museums here regardless of `is_published`, and that nobody else's
 * summaries could leak in even if this filter were ever removed.
 */
export async function getMuseumSummariesForOwner(ownerId: string): Promise<MuseumSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("museums")
    .select("id, name, description, created_at, is_published, cover_artwork_id")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const coverImageUrls = await getCoverImageUrls(
    supabase,
    data.map((row) => ({ id: row.id, coverArtworkId: row.cover_artwork_id }))
  );

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    isPublished: row.is_published,
    coverImageUrl: coverImageUrls.get(row.id) ?? null,
  }));
}

export interface CoverImageQuery {
  id: string;
  /** Owner-picked artwork id (CoverArtworkPicker), or null to fall back to
   * the museum's first artwork by display order. */
  coverArtworkId: string | null;
}

/**
 * Resolves each museum's cover image -- the owner's explicitly chosen
 * artwork if they've picked one, otherwise its first artwork by display
 * order -- through the same signed-URL path `getArtworksForMuseum` already
 * uses for every artwork image. No new access system: this reads through
 * the same RLS-scoped client, the same private bucket, the same
 * `getSignedArtworkUrls` batching helper. Museums with no artwork yet are
 * simply absent from the returned map. A `coverArtworkId` that no longer
 * matches any artwork of that museum (e.g. it was since deleted, though
 * `cover_artwork_id`'s `on delete set null` should normally prevent that)
 * silently falls back to the first artwork rather than erroring.
 */
export async function getCoverImageUrls(
  supabase: SupabaseServerClient,
  museums: CoverImageQuery[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (museums.length === 0) return result;

  const { data, error } = await supabase
    .from("artworks")
    .select("id, museum_id, storage_path, display_order")
    .in(
      "museum_id",
      museums.map((m) => m.id)
    )
    .order("display_order", { ascending: true });

  if (error || !data) return result;

  const artworksByMuseum = new Map<string, { id: string; storage_path: string }[]>();
  for (const row of data) {
    const list = artworksByMuseum.get(row.museum_id);
    if (list) list.push(row);
    else artworksByMuseum.set(row.museum_id, [row]);
  }

  const chosenPathByMuseum = new Map<string, string>();
  for (const museum of museums) {
    const artworks = artworksByMuseum.get(museum.id);
    if (!artworks || artworks.length === 0) continue;
    const picked = museum.coverArtworkId
      ? artworks.find((a) => a.id === museum.coverArtworkId)
      : undefined;
    chosenPathByMuseum.set(museum.id, (picked ?? artworks[0]).storage_path);
  }
  if (chosenPathByMuseum.size === 0) return result;

  const signedUrls = await getSignedArtworkUrls(supabase, [...chosenPathByMuseum.values()]);
  for (const [museumId, path] of chosenPathByMuseum) {
    const url = signedUrls.get(path);
    if (url) result.set(museumId, url);
  }
  return result;
}

export interface PublicMuseumSummary extends MuseumSummary {
  creatorUsername: string;
  creatorDisplayName: string;
}

/**
 * Listing for the public /explore page -- every published museum
 * (regardless of owner), newest first. Unlike getMuseumSummariesForOwner
 * this has no owner filter at all: RLS's `museums_select_published_or_own`
 * already restricts an anonymous/other-user read to `is_published = true`
 * rows, so the explicit `.eq("is_published", true)` here is redundant with
 * RLS but kept anyway to make the query's intent legible on its own and to
 * exclude the requesting user's own drafts, which RLS alone would let
 * through.
 */
export async function getPublishedMuseumSummaries(): Promise<PublicMuseumSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("museums")
    .select("id, name, description, created_at, is_published, owner_id, cover_artwork_id")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const [coverImageUrls, creators] = await Promise.all([
    getCoverImageUrls(
      supabase,
      data.map((row) => ({ id: row.id, coverArtworkId: row.cover_artwork_id }))
    ),
    getCreatorsByOwnerId(supabase, data.map((row) => row.owner_id)),
  ]);

  return data.map((row) => {
    const creator = creators.get(row.owner_id);
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      isPublished: row.is_published,
      coverImageUrl: coverImageUrls.get(row.id) ?? null,
      creatorUsername: creator?.username ?? "unknown",
      creatorDisplayName: creator?.displayName ?? "Unknown creator",
    };
  });
}

/**
 * Batched profiles(owner_id) -> {username, displayName} lookup for the
 * explore listing's "by [creator]" line. Same shape as getCoverImageUrls:
 * one `.in(...)` query plus an in-memory map, no per-row round trip. `museums`
 * has no FK straight to `profiles` (both instead reference `auth.users`), so
 * this can't be expressed as a single PostgREST embed and has to be a
 * separate query joined here in JS.
 */
async function getCreatorsByOwnerId(
  supabase: SupabaseServerClient,
  ownerIds: string[]
): Promise<Map<string, { username: string; displayName: string }>> {
  const result = new Map<string, { username: string; displayName: string }>();
  const uniqueOwnerIds = [...new Set(ownerIds)];
  if (uniqueOwnerIds.length === 0) return result;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", uniqueOwnerIds);

  if (error || !data) return result;

  for (const row of data) {
    result.set(row.id, { username: row.username, displayName: row.display_name });
  }
  return result;
}

export interface MuseumEditContext {
  id: string;
  name: string;
  description: string;
  isPublished: boolean;
  theme: GalleryThemeId;
  /** Owner-picked cover artwork id (see CoverArtworkPicker), or null if the
   * museum still falls back to its first artwork by display order. */
  coverArtworkId: string | null;
  /** The museum's first/main room in full -- `null` for a museum with no
   * room yet. Used by server/museumLayout.ts's relayoutMuseum to detect a
   * hand-authored custom room (GalleryRoom.modelUrl) so an artwork add/
   * remove re-lays-out frames without ever recomputing that room's shape. */
  room: Museum["rooms"][number] | null;
}

/**
 * Purpose-built read for the edit page (Phase 3) -- deliberately separate
 * from `getMuseumById`/`MUSEUM_COLUMNS` above, which back the public 3D
 * viewer and don't need `is_published` or `theme` (the viewer reads the
 * room's own `theme` field out of the `rooms` jsonb it already fetches).
 * Scoped by `ownerId` in addition to RLS, so a non-owner or a wrong id
 * indistinguishably comes back as `null` here, matching `deleteMuseum`'s
 * not-found-or-not-owned convention.
 */
export async function getMuseumEditContext(
  museumId: string,
  ownerId: string
): Promise<MuseumEditContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("museums")
    .select("id, name, description, is_published, rooms, cover_artwork_id")
    .eq("id", museumId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error || !data) return null;
  const rooms = data.rooms as Museum["rooms"];
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    isPublished: data.is_published,
    theme: rooms[0]?.theme ?? "linen",
    coverArtworkId: data.cover_artwork_id,
    room: rooms[0] ?? null,
  };
}

export interface MuseumMetadataPatch {
  name?: string;
  description?: string;
  isPublished?: boolean;
  theme?: GalleryThemeId;
  /** Set to an artwork id to pin the cover thumbnail, or `null` to revert to
   * the default (first artwork by display order). Undefined leaves it
   * untouched -- same "only patch what's present" convention as every other
   * field here. */
  coverArtworkId?: string | null;
  /** Hand-authored overrides for the museum's first/main room -- how a
   * custom Blender room (GalleryRoom.modelUrl) gets attached, since there's
   * no dashboard UI for it. Each field is merged onto the existing room
   * individually (only what's provided changes); `modelUrl: null` reverts
   * the room to the procedural Floor/Walls renderer. No-op if the museum
   * has no room yet. */
  room?: {
    modelUrl?: string | null;
    bounds?: RoomBounds;
    height?: number;
    openings?: WallOpening[];
  };
}

/**
 * Updates museum-level metadata/publish state/theme. Scoped by `ownerId` in
 * addition to RLS's own `owner_id = auth.uid()` check (`museums_update_own`)
 * -- belt-and-suspenders, not a substitute for it. A `theme` change also
 * patches `rooms[0].theme` in the same statement, since that's the field
 * actually read at render time (see `MuseumEditContext` above); the
 * `theme` column itself stays in sync as a denormalized copy, matching how
 * `createMuseum` already writes it. Returns `false` if no row matched
 * (not found, or not owned by `ownerId`).
 */
export async function updateMuseumMetadata(
  museumId: string,
  ownerId: string,
  patch: MuseumMetadataPatch
): Promise<boolean> {
  const supabase = await createClient();

  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.isPublished !== undefined) update.is_published = patch.isPublished;
  if (patch.coverArtworkId !== undefined) update.cover_artwork_id = patch.coverArtworkId;

  if (patch.theme !== undefined || patch.room !== undefined) {
    const { data: current, error: readError } = await supabase
      .from("museums")
      .select("rooms")
      .eq("id", museumId)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (readError || !current) return false;

    const rooms = current.rooms as Museum["rooms"];
    if (rooms[0]) {
      if (patch.theme !== undefined) {
        rooms[0] = { ...rooms[0], theme: patch.theme };
        update.theme = patch.theme;
      }
      if (patch.room !== undefined) {
        const roomPatch = patch.room;
        rooms[0] = {
          ...rooms[0],
          ...(roomPatch.bounds !== undefined && { bounds: roomPatch.bounds }),
          ...(roomPatch.height !== undefined && { height: roomPatch.height }),
          ...(roomPatch.openings !== undefined && { openings: roomPatch.openings }),
          modelUrl: roomPatch.modelUrl === undefined ? rooms[0].modelUrl : (roomPatch.modelUrl ?? undefined),
        };
      }
    }
    update.rooms = rooms;
  }

  if (Object.keys(update).length === 0) return true;

  const { data, error } = await supabase
    .from("museums")
    .update(update)
    .eq("id", museumId)
    .eq("owner_id", ownerId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[museums] failed to update museum metadata:", error.message, museumId);
  }
  return !error && data !== null;
}

/**
 * Writes a freshly recomputed layout (room bounds/openings, opening
 * connectors, spawn point) back onto an existing museum row -- used by
 * `server/museumLayout.ts`'s `relayoutMuseum` after an artwork is added or
 * removed. Never touches `name`/`description`/`is_published`/`theme`.
 */
export async function updateMuseumLayout(
  museumId: string,
  ownerId: string,
  layout: Pick<Museum, "rooms" | "openingConnectors" | "spawnPoint">
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("museums")
    .update({
      rooms: layout.rooms,
      opening_connectors: layout.openingConnectors,
      spawn_point: layout.spawnPoint,
    })
    .eq("id", museumId)
    .eq("owner_id", ownerId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[museums] failed to update museum layout:", error.message, museumId);
  }
  return !error && data !== null;
}

export async function getMuseumById(id: string): Promise<Museum | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("museums")
    .select(MUSEUM_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return rowToMuseum(data);
}

export async function hasMuseum(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("museums").select("id").eq("id", id).maybeSingle();
  return !error && data !== null;
}

/** Inserts a newly-created museum row (rooms/layout only -- artwork rows are
 * inserted separately via server/artworksRepository.ts's insertArtworks).
 * `cover_artwork_id` is deliberately left unset here even when the creator
 * picked a cover up front -- that column has a FK into `artworks`, which
 * doesn't have rows yet at this point in museum creation (this insert runs
 * before insertArtworks below it). The route sets it afterward, once the
 * artwork rows it references actually exist -- see setCoverArtworkId.
 * Throws on failure (e.g. RLS rejection because the caller isn't
 * authenticated) so the route handler can surface a clear error instead of
 * silently losing the museum. */
export async function createMuseum(
  museum: Omit<Museum, "artworks">
): Promise<void> {
  const supabase = await createClient();
  const theme = museum.rooms[0]?.theme ?? "linen";

  const { error } = await supabase.from("museums").insert({
    id: museum.id,
    owner_id: museum.ownerId,
    name: museum.name,
    description: museum.description,
    theme,
    spawn_point: museum.spawnPoint,
    rooms: museum.rooms,
    opening_connectors: museum.openingConnectors,
    // `artworks` jsonb column intentionally omitted -- falls back to its
    // `default '[]'::jsonb`. See file header.
  });

  if (error) {
    console.error("[museums] failed to insert museum row:", error.message, museum.id);
    throw new Error(`Failed to save museum: ${error.message}`);
  }
}

/** Sets a just-created museum's cover thumbnail once its artwork rows
 * exist (see createMuseum's doc comment on why this can't happen in the
 * same insert). Best-effort by design: called after the museum and its
 * artworks are already durably saved, so a failure here shouldn't roll
 * back museum creation over what's just a thumbnail pick -- callers should
 * swallow/log a `false` return rather than fail the whole request. */
export async function setCoverArtworkId(
  museumId: string,
  ownerId: string,
  coverArtworkId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("museums")
    .update({ cover_artwork_id: coverArtworkId })
    .eq("id", museumId)
    .eq("owner_id", ownerId);
  return !error;
}

/**
 * Deletes a museum and cleans up its Storage objects. Deliberately
 * DB-first, Storage-second: the `museums` row delete (cascading to
 * `artworks` via its foreign key) is one atomic Postgres statement and is
 * the authoritative, user-visible "this museum is gone" operation. Storage
 * cleanup only runs after that succeeds, and is best-effort -- if it fails
 * or only partially completes, the museum is still correctly deleted
 * everywhere the app or RLS can see it, and what's left behind is an
 * orphaned Storage folder at a fully deterministic path
 * (`{ownerId}/{museumId}/`) that doesn't depend on any surviving DB row, so
 * it can be found and retried later (deleteArtworkFolder is idempotent --
 * removing an already-removed object is a no-op).
 */
export async function deleteMuseum(
  museumId: string,
  ownerId: string
): Promise<{ deleted: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("museums")
    .delete()
    .eq("id", museumId)
    .eq("owner_id", ownerId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[museums] failed to delete museum row:", error.message, museumId);
  }
  if (error || !data) return { deleted: false };

  await deleteArtworkFolder(supabase, ownerId, museumId);

  return { deleted: true };
}
