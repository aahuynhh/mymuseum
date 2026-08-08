import "server-only";
import type { Artwork } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { getSignedArtworkUrls } from "@/lib/artwork/storage";

/**
 * Postgres-backed store for individual artwork rows (Phase 2 -- replaces
 * the base64-in-jsonb `museums.artworks` column). Every call goes through a
 * request-scoped Supabase client on the caller's own session, so Row Level
 * Security (supabase/migrations/0003_artwork_storage.sql) is what actually
 * enforces ownership -- not this module. `owner_id` is never set from here;
 * the `artworks_sync_owner_trigger` derives it from `museum_id` server-side.
 */

interface ArtworkRow {
  id: string;
  storage_path: string;
  title: string;
  artist: string;
  year: number;
  medium: string;
  description: string;
  alt_text: string;
  image_width: number;
  image_height: number;
  display_order: number;
  wall_position: Artwork["wallPosition"];
  interaction_zone: Artwork["interactionZone"];
  frame_width: number | null;
  frame_height: number | null;
}

export interface NewArtworkRow {
  id: string;
  museumId: string;
  title: string;
  artist: string;
  year: number;
  medium: string;
  description: string;
  altText: string;
  storagePath: string;
  imageWidth: number;
  imageHeight: number;
  displayOrder: number;
  wallPosition: Artwork["wallPosition"];
  interactionZone: Artwork["interactionZone"];
  frameWidth?: number;
  frameHeight?: number;
}

/** Inserts every artwork row for a museum in one request (all-or-nothing --
 * see app/api/museums/route.ts for the upload-then-insert-then-rollback
 * sequencing this participates in). */
export async function insertArtworks(rows: NewArtworkRow[]): Promise<void> {
  if (rows.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.from("artworks").insert(
    rows.map((row) => ({
      id: row.id,
      museum_id: row.museumId,
      title: row.title,
      artist: row.artist,
      year: row.year,
      medium: row.medium,
      description: row.description,
      alt_text: row.altText,
      storage_path: row.storagePath,
      image_width: row.imageWidth,
      image_height: row.imageHeight,
      display_order: row.displayOrder,
      wall_position: row.wallPosition,
      interaction_zone: row.interactionZone,
      frame_width: row.frameWidth ?? null,
      frame_height: row.frameHeight ?? null,
    }))
  );
  if (error) {
    console.error("[artworks] failed to insert artwork rows:", error.message, rows[0]?.museumId);
    throw new Error(`Failed to save artwork: ${error.message}`);
  }
}

/**
 * Reads every artwork belonging to a museum, ordered for display, and
 * resolves each one's real (private, signed) image URL in a single batched
 * call. RLS means a private museum's artwork simply returns empty for
 * anyone but its owner -- identical in shape to how getMuseumById already
 * treats a private museum as "doesn't exist" for other viewers.
 */
export async function getArtworksForMuseum(museumId: string): Promise<Artwork[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artworks")
    .select(
      "id, storage_path, title, artist, year, medium, description, alt_text, image_width, image_height, display_order, wall_position, interaction_zone, frame_width, frame_height"
    )
    .eq("museum_id", museumId)
    .order("display_order", { ascending: true });

  if (error || !data || data.length === 0) return [];

  const rows = data as ArtworkRow[];
  const signedUrls = await getSignedArtworkUrls(
    supabase,
    rows.map((row) => row.storage_path)
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    artist: row.artist,
    year: row.year,
    medium: row.medium,
    description: row.description,
    altText: row.alt_text,
    imageUrl: signedUrls.get(row.storage_path) ?? "",
    displayOrder: row.display_order,
    wallPosition: row.wall_position,
    interactionZone: row.interaction_zone,
    frameWidth: row.frame_width ?? undefined,
    frameHeight: row.frame_height ?? undefined,
    imageAspectRatio: row.image_width / row.image_height,
  }));
}

export interface ArtworkLayoutRow {
  id: string;
  title: string;
  artist: string;
  year: number;
  medium: string;
  description: string;
  altText: string;
  storagePath: string;
  imageWidth: number;
  imageHeight: number;
  imageAspectRatio: number;
}

/**
 * Raw rows for `server/museumLayout.ts`'s `relayoutMuseum` -- everything
 * `game/museum/autoLayout.ts`'s `generateSingleRoomMuseum` needs to
 * recompute wall placement, deliberately excluding the signed `imageUrl`
 * round trip `getArtworksForMuseum` does (layout math never reads the image
 * itself, only its stored aspect ratio and its Storage path, which is
 * copied straight through as the pre-signed-URL `imageUrl` field the layout
 * function expects -- see `UploadedArtworkInput`).
 */
export async function getArtworkRowsForLayout(museumId: string): Promise<ArtworkLayoutRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artworks")
    .select("id, title, artist, year, medium, description, alt_text, storage_path, image_width, image_height")
    .eq("museum_id", museumId)
    .order("display_order", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    artist: row.artist,
    year: row.year,
    medium: row.medium,
    description: row.description,
    altText: row.alt_text,
    storagePath: row.storage_path,
    imageWidth: row.image_width,
    imageHeight: row.image_height,
    imageAspectRatio: row.image_width / row.image_height,
  }));
}

export interface ArtworkMetadataPatch {
  title?: string;
  artist?: string;
  year?: number;
  medium?: string;
  description?: string;
  altText?: string;
}

/**
 * Updates an existing artwork's text fields only -- never its image, its
 * layout, or its `museum_id`. Scoped by both `museumId` and `id` (in
 * addition to RLS's own `artworks_update_own`), so a mismatched pairing --
 * e.g. someone else's artwork id, or an artwork id that belongs to a
 * different museum than the one in the URL -- comes back `false` rather
 * than silently touching the wrong row. Returns `false` if no row matched.
 */
export async function updateArtworkMetadata(
  artworkId: string,
  museumId: string,
  patch: ArtworkMetadataPatch
): Promise<boolean> {
  if (Object.keys(patch).length === 0) return true;
  const supabase = await createClient();

  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.artist !== undefined) update.artist = patch.artist;
  if (patch.year !== undefined) update.year = patch.year;
  if (patch.medium !== undefined) update.medium = patch.medium;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.altText !== undefined) update.alt_text = patch.altText;

  const { data, error } = await supabase
    .from("artworks")
    .update(update)
    .eq("id", artworkId)
    .eq("museum_id", museumId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[artworks] failed to update artwork metadata:", error.message, artworkId);
  }
  return !error && data !== null;
}

/** Counts a museum's artwork rows -- used to enforce the "at least one
 * artwork must remain" rule on delete and the per-museum upload cap on
 * add, without pulling every row's full layout data just to get a length. */
export async function getArtworkCountForMuseum(museumId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("artworks")
    .select("id", { count: "exact", head: true })
    .eq("museum_id", museumId);
  if (error || count === null) return 0;
  return count;
}

/**
 * Deletes one artwork row, scoped by both `museumId` and `id` (plus RLS's
 * own `artworks_delete_own`). Returns the row's `storage_path` on success so
 * the caller can best-effort remove the matching Storage object -- DB-first,
 * Storage-second, the same ordering `deleteMuseum` already uses. Returns
 * `null` if no row matched (not found, not owned, or wrong museum).
 */
export async function deleteArtwork(artworkId: string, museumId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artworks")
    .delete()
    .eq("id", artworkId)
    .eq("museum_id", museumId)
    .select("storage_path")
    .maybeSingle();

  if (error) {
    console.error("[artworks] failed to delete artwork row:", error.message, artworkId);
  }
  if (error || !data) return null;
  return data.storage_path;
}

export interface ArtworkLayoutUpdate {
  id: string;
  displayOrder: number;
  wallPosition: Artwork["wallPosition"];
  interactionZone: Artwork["interactionZone"];
  frameWidth?: number;
  frameHeight?: number;
}

/**
 * Writes recomputed layout fields back onto each artwork row after an add
 * or remove -- used by `server/museumLayout.ts`'s `relayoutMuseum`. One
 * small `UPDATE` per row (collections here are capped at
 * `MAX_ARTWORKS_PER_MUSEUM`, so this is never more than a handful of
 * requests) rather than an `upsert`, which would require re-sending every
 * NOT NULL column and risk clobbering fields this function has no business
 * touching (title, artist, storage_path, ...).
 */
export async function updateArtworkLayouts(rows: ArtworkLayoutUpdate[]): Promise<boolean> {
  if (rows.length === 0) return true;
  const supabase = await createClient();

  const results = await Promise.all(
    rows.map((row) =>
      supabase
        .from("artworks")
        .update({
          display_order: row.displayOrder,
          wall_position: row.wallPosition,
          interaction_zone: row.interactionZone,
          frame_width: row.frameWidth ?? null,
          frame_height: row.frameHeight ?? null,
        })
        .eq("id", row.id)
    )
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error("[artworks] failed to update artwork layout:", failed.error.message);
    return false;
  }
  return true;
}
