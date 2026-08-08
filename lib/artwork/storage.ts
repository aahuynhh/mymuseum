import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Storage path/URL helpers for the private "artwork-images" bucket. Every
 * call here goes through a request-scoped Supabase client authenticated as
 * the current user's own session (see lib/supabase/server.ts) -- no
 * service-role key, same as the rest of this app. Bucket-level RLS
 * (supabase/migrations/0003_artwork_storage.sql) is what actually enforces
 * who can read/write which objects; this module just shapes the calls.
 */

export const ARTWORK_BUCKET = "artwork-images";

// Short-lived on purpose: every server render of a museum mints fresh URLs
// via getArtworksForMuseum, so there's no need for a link that outlives a
// single page view by much. A long-lived signed URL stays usable after
// expiration would otherwise be the wrong side effect if a museum's
// publication state changes right after a link was copied/leaked.
export const SIGNED_URL_TTL_SECONDS = 15 * 60; // 15 minutes

export function buildArtworkStoragePath(
  ownerId: string,
  museumId: string,
  artworkId: string,
  extension: string
): string {
  return `${ownerId}/${museumId}/${artworkId}.${extension}`;
}

export async function uploadArtworkImage(
  supabase: SupabaseClient,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const { error } = await supabase.storage.from(ARTWORK_BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) {
    console.error("[artwork-storage] failed to upload object:", error.message, path);
    throw new Error(`Failed to upload artwork image: ${error.message}`);
  }
}

/** Best-effort removal of specific objects. Never throws -- a failure here
 * leaves a retriable orphan (see deleteArtworkFolder), never blocks the
 * caller's own DB-level success/failure decision. */
export async function deleteArtworkImages(
  supabase: SupabaseClient,
  paths: string[]
): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(ARTWORK_BUCKET).remove(paths);
  if (error) {
    console.error("[artwork-storage] failed to remove objects (retriable):", error.message, paths);
  }
}

/**
 * Removes every object under a museum's folder by listing it directly,
 * rather than relying on any Postgres row still existing -- this is what
 * makes cleanup safe to run (and safe to retry) after the museums row (and
 * its cascaded artworks rows) has already been deleted. See
 * server/museumsRepository.ts deleteMuseum for the DB-first ordering this
 * depends on.
 */
export async function deleteArtworkFolder(
  supabase: SupabaseClient,
  ownerId: string,
  museumId: string
): Promise<void> {
  const prefix = `${ownerId}/${museumId}`;
  const { data, error } = await supabase.storage.from(ARTWORK_BUCKET).list(prefix);
  if (error) {
    console.error("[artwork-storage] failed to list folder for cleanup (retriable):", error.message, prefix);
    return;
  }
  if (!data || data.length === 0) return;

  const paths = data.map((entry) => `${prefix}/${entry.name}`);
  await deleteArtworkImages(supabase, paths);
}

/** Batched signed-URL fetch -- one request regardless of artwork count,
 * avoiding an N+1 round trip per museum read. */
export async function getSignedArtworkUrls(
  supabase: SupabaseClient,
  paths: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (paths.length === 0) return result;

  const { data, error } = await supabase.storage
    .from(ARTWORK_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return result;
  for (const entry of data) {
    if (entry.signedUrl && entry.path) result.set(entry.path, entry.signedUrl);
  }
  return result;
}
