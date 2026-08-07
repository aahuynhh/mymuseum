import type { Artwork } from "@/types";

/** Returns the id of the nearest artwork whose interaction zone contains (x, z), if any. */
export function findNearbyArtwork(
  x: number,
  z: number,
  artworks: Artwork[]
): string | null {
  let closestId: string | null = null;
  let closestDist = Infinity;

  for (const artwork of artworks) {
    const dx = x - artwork.interactionZone.x;
    const dz = z - artwork.interactionZone.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= artwork.interactionZone.radius && dist < closestDist) {
      closestDist = dist;
      closestId = artwork.id;
    }
  }

  return closestId;
}
