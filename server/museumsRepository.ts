import "server-only";
import type { Museum } from "@/types";
import { createClient } from "@/lib/supabase/server";

/**
 * Postgres-backed store for user-created museums (replaces the old
 * file-backed `server/museumStore.ts`). Every call goes through a
 * request-scoped Supabase client authenticated as the current user's own
 * session, so Row Level Security -- not this module -- is what actually
 * enforces "only the owner can write their museum" and "only a published
 * museum, or the owner's own museum, can be read." See
 * supabase/migrations/0001_init.sql and 0002_museum_visibility.sql for the
 * table and policies. Because RLS filters rows before this module ever sees
 * them, `getMuseumById`/`hasMuseum` need no visibility-specific logic here:
 * a private museum requested by anyone but its owner comes back exactly
 * like a museum that doesn't exist.
 */

interface MuseumRow {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  spawn_point: Museum["spawnPoint"];
  rooms: Museum["rooms"];
  opening_connectors: Museum["openingConnectors"];
  artworks: Museum["artworks"];
}

function rowToMuseum(row: MuseumRow): Museum {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    artworks: row.artworks,
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
}

/**
 * Lightweight listing for the dashboard -- selects only the columns a list
 * view needs (never `artworks`, which embeds full base64 image data) and
 * filters by `ownerId`. Callers must pass an id derived from the current
 * server-side session (e.g. `getCurrentUser()`), never from client input --
 * this filter is what keeps the dashboard scoped to one user's museums. RLS
 * separately guarantees the owner can read all of their own museums here
 * regardless of `is_published`, and that nobody else's summaries could leak
 * in even if this filter were ever removed.
 */
export async function getMuseumSummariesForOwner(ownerId: string): Promise<MuseumSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("museums")
    .select("id, name, description, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
  }));
}

export async function getMuseumById(id: string): Promise<Museum | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("museums")
    .select("id, owner_id, name, description, spawn_point, rooms, opening_connectors, artworks")
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

/** Inserts a newly-created museum. Throws on failure (e.g. RLS rejection
 * because the caller isn't authenticated) so the route handler can surface
 * a clear error instead of silently losing the museum. */
export async function createMuseum(museum: Museum): Promise<void> {
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
    artworks: museum.artworks,
  });

  if (error) throw new Error(`Failed to save museum: ${error.message}`);
}
