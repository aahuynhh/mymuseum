import "server-only";
import { layoutArtworksForRoom, type UploadedArtworkInput } from "@/game/museum/autoLayout";
import { generateMuseumLayout } from "@/game/museum/multiRoomLayout";
import { getMuseumEditContext, updateMuseumLayout } from "./museumsRepository";
import { getArtworkRowsForLayout, updateArtworkLayouts } from "./artworksRepository";

/**
 * Recomputes the single-room layout (wall placement, frame sizes, and --
 * unless the room is a hand-authored custom model, see below -- room bounds
 * and spawn point) for a museum's current artwork set, and persists it.
 * Called after any artwork add or remove -- never after a text-only
 * metadata edit or a theme change, neither of which affect layout (see the
 * Phase 3 plan, "Relayout behavior on add/remove").
 *
 * Returns `true` on success. A `false` return means the artwork add/remove
 * itself already committed -- this only means the *positions* are stale
 * until the next successful relayout, never that anything is missing,
 * broken, or overlapping (remaining frames keep their last valid
 * positions).
 */
export async function relayoutMuseum(museumId: string, ownerId: string): Promise<boolean> {
  const context = await getMuseumEditContext(museumId, ownerId);
  if (!context) return false;

  const rows = await getArtworkRowsForLayout(museumId);

  const layoutInputs: UploadedArtworkInput[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    artist: row.artist,
    year: row.year,
    medium: row.medium,
    description: row.description,
    altText: row.altText,
    imageUrl: row.storagePath,
    imageAspectRatio: row.imageAspectRatio,
  }));

  // A custom Blender room (GalleryRoom.modelUrl) has hand-authored
  // bounds/height/openings matched to its actual geometry -- those must
  // never be recomputed here, so this branch only re-runs artwork
  // placement against the room exactly as it already is, and skips
  // updateMuseumLayout (and therefore rooms/openingConnectors/spawnPoint)
  // entirely.
  if (context.room?.modelUrl) {
    const artworks = layoutArtworksForRoom(context.room, layoutInputs);
    return updateArtworkLayouts(
      artworks.map((artwork) => ({
        id: artwork.id,
        displayOrder: artwork.displayOrder,
        wallPosition: artwork.wallPosition,
        interactionZone: artwork.interactionZone,
        frameWidth: artwork.frameWidth,
        frameHeight: artwork.frameHeight,
      }))
    );
  }

  // Reuses `generateMuseumLayout` exactly as the create flow
  // (app/api/museums/route.ts) already does -- same tiered algorithm, just
  // re-run over the post-edit artwork list, rather than a second layout
  // implementation. The room count/shape and each room's bounds/spawnPoint
  // may shift as a deterministic function of the new artwork count --
  // including crossing from one size tier into another -- but the museum's
  // `id` is never touched, so its URL stays stable.
  const museum = generateMuseumLayout({
    id: museumId,
    ownerId,
    name: context.name,
    description: context.description,
    theme: context.theme,
    artworks: layoutInputs,
  });

  const layoutOk = await updateMuseumLayout(museumId, ownerId, {
    rooms: museum.rooms,
    openingConnectors: museum.openingConnectors,
    spawnPoint: museum.spawnPoint,
  });
  if (!layoutOk) return false;

  return updateArtworkLayouts(
    museum.artworks.map((artwork) => ({
      id: artwork.id,
      displayOrder: artwork.displayOrder,
      wallPosition: artwork.wallPosition,
      interactionZone: artwork.interactionZone,
      frameWidth: artwork.frameWidth,
      frameHeight: artwork.frameHeight,
    }))
  );
}
