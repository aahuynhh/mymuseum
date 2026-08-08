import "server-only";
import type { Museum } from "@/types";
import type { GalleryThemeId } from "@/game/museum/themes";
import { createClient } from "@/lib/supabase/server";
import { getArtworksForMuseum } from "./artworksRepository";
import { deleteArtworkFolder } from "@/lib/artwork/storage";

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
    .select("id, name, description, created_at, is_published")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    isPublished: row.is_published,
  }));
}

export interface MuseumEditContext {
  id: string;
  name: string;
  description: string;
  isPublished: boolean;
  theme: GalleryThemeId;
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
    .select("id, name, description, is_published, rooms")
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
  };
}

export interface MuseumMetadataPatch {
  name?: string;
  description?: string;
  isPublished?: boolean;
  theme?: GalleryThemeId;
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

  if (patch.theme !== undefined) {
    const { data: current, error: readError } = await supabase
      .from("museums")
      .select("rooms")
      .eq("id", museumId)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (readError || !current) return false;

    const rooms = current.rooms as Museum["rooms"];
    if (rooms[0]) rooms[0] = { ...rooms[0], theme: patch.theme };
    update.rooms = rooms;
    update.theme = patch.theme;
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
