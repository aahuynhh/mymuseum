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
