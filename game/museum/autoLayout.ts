import type { Artwork, GalleryRoom, Museum, WallSide } from "@/types";
import type { GalleryThemeId } from "./themes";
import { placeOnWall, wallSegments, wallSpan, type WallSpanSegment } from "./placement";

export interface UploadedArtworkInput {
  id: string;
  title: string;
  artist: string;
  year: number;
  medium: string;
  description: string;
  altText: string;
  /** Phase 2: this is the artwork's Storage path ("{ownerId}/{museumId}/
   * {artworkId}.{ext}"), not a data URL or a real fetchable URL -- layout
   * math here never reads it, only copies it through onto the returned
   * Artwork. The repository layer (server/artworksRepository.ts) is what
   * resolves a real, short-lived signed URL at read time. */
  imageUrl: string;
  /** Source image width / height, used to size the frame without cropping or
   * stretching the uploaded image. Server-derived (sharp), never trusted
   * from the client. */
  imageAspectRatio: number;
}

export interface GenerateSingleRoomMuseumInput {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  theme: GalleryThemeId;
  artworks: UploadedArtworkInput[];
}

const WALLS: WallSide[] = ["north", "east", "west"];

// Target frame *area* (world units^2), cycled per wall so consecutive pieces
// alternate large/medium/small instead of every frame reading the same
// size -- a real gallery mixes a focal-point piece in with smaller ones for
// rhythm rather than a uniform grid.
const AREA_TIERS = [3.2, 1.95, 1.2, 2.5];
// The size a frame "wants" to be along its shorter dimension. This is a
// *soft* floor -- clampToSlot below will shrink a frame past it rather than
// ever let a frame overlap its neighbor or cross the wall's own corner.
// Fit inside the wall always wins over hitting this preference.
const MIN_DIMENSION = 0.85;
// Aspect ratio is never applied to the source image (which is always shown
// uncropped/unstretched) -- this only bounds how extreme the *frame's* shape
// is allowed to get, so a very panoramic or very tall upload still fits
// reasonably within the available wall space.
const ASPECT_CLAMP = [0.45, 2.3] as const;
// Clear space reserved at each end of a wall so a frame's edge can never
// reach the corner (and whatever perpendicular wall or doorway trim is
// there). Fixed in world units, not a percentage of the wall's length --
// a percentage margin shrinks away to nothing on short walls with few
// pieces, which is exactly the case (2-3 items per wall) that was
// producing frames that spilled past the corner.
const CORNER_MARGIN = 0.6;
// Minimum clear gap between two adjacent frames sharing a wall.
const MIN_GAP = 0.45;

/** The frame size an artwork's own aspect ratio "wants" at a given size
 * tier, before it's fit against the wall it'll actually hang on. */
function idealSize(imageAspectRatio: number, tierIndex: number): { width: number; height: number } {
  const aspect = Math.min(ASPECT_CLAMP[1], Math.max(ASPECT_CLAMP[0], imageAspectRatio || 1));
  const area = AREA_TIERS[tierIndex % AREA_TIERS.length];
  return { width: Math.sqrt(area * aspect), height: Math.sqrt(area / aspect) };
}

/**
 * Scales a frame size down -- preserving aspect ratio, so the artwork
 * itself is never distorted -- to fit within a hard per-slot ceiling, then
 * only grows it back toward MIN_DIMENSION as far as that same ceiling
 * still allows. The ceiling is derived from the wall's actual available
 * space (see layoutWall), so this can never produce a frame wider or
 * taller than the room can actually hold, however small the room or
 * however many pieces share the wall.
 */
function clampToSlot(
  size: { width: number; height: number },
  maxWidth: number,
  maxHeight: number
): { frameWidth: number; frameHeight: number } {
  let { width, height } = size;
  const shrink = Math.min(1, maxWidth / width, maxHeight / height);
  width *= shrink;
  height *= shrink;

  const smaller = Math.min(width, height);
  if (smaller < MIN_DIMENSION) {
    const wantedGrow = MIN_DIMENSION / smaller;
    const safeGrow = Math.min(wantedGrow, maxWidth / width, maxHeight / height);
    width *= safeGrow;
    height *= safeGrow;
  }

  return { frameWidth: width, frameHeight: height };
}

/**
 * Lays out artworks along one wall so that, whatever sizes they end up at,
 * none can overlap a neighbor or cross the wall's own corners: every
 * frame's size is fit against a hard per-slot ceiling computed from the
 * wall's real usable length *first*, then positions are placed from the
 * frames' real widths plus a guaranteed minimum gap, and the row is spread
 * across (and centered within) the available run rather than bunched up.
 */
function layoutWall(
  spanMin: number,
  spanMax: number,
  maxHeight: number,
  items: UploadedArtworkInput[],
  tierOffset: number
): { frameWidth: number; frameHeight: number; center: number }[] {
  const count = items.length;
  if (count === 0) return [];

  const usableLength = Math.max(0, spanMax - spanMin - 2 * CORNER_MARGIN);
  // Worst-case equal division -- the hard per-slot width ceiling every
  // frame is fit against, regardless of what size the tier system wants.
  const slotWidth = Math.max(0.4, (usableLength - (count - 1) * MIN_GAP) / count);

  const sized = items.map((item, i) =>
    clampToSlot(idealSize(item.imageAspectRatio, tierOffset + i), slotWidth, maxHeight)
  );

  const totalFrameWidth = sized.reduce((sum, s) => sum + s.frameWidth, 0);
  // Real pieces usually come in under the worst-case slot width, so spread
  // the leftover room out as extra gap instead of leaving it as one empty
  // stretch at each end -- reads as intentionally, evenly hung rather than
  // huddled in the middle of the wall. MIN_GAP is a floor, guaranteed
  // satisfiable because totalFrameWidth <= count * slotWidth by
  // construction of clampToSlot above.
  const gap = count > 1 ? Math.max(MIN_GAP, (usableLength - totalFrameWidth) / (count - 1)) : 0;
  const totalWidth = totalFrameWidth + gap * (count - 1);

  let cursor = (spanMin + spanMax) / 2 - totalWidth / 2;
  return sized.map((s) => {
    const center = cursor + s.frameWidth / 2;
    cursor += s.frameWidth + gap;
    return { ...s, center };
  });
}

/**
 * Same idea as `layoutWall`, but across the (possibly two) solid segments a
 * wall is left with once its own opening is cut out, instead of one clean
 * span. Splits the item list across segments proportionally to each
 * segment's length -- a sliver of a segment (a doorway pushed close to one
 * corner) naturally gets few or zero items rather than being forced to
 * squeeze its "fair share" in -- and returns results in the same order as
 * `items` so the caller can zip them back together positionally, same as
 * `layoutWall` itself.
 */
function layoutWallSegments(
  segments: WallSpanSegment[],
  maxHeight: number,
  items: UploadedArtworkInput[],
  tierOffset: number
): { frameWidth: number; frameHeight: number; center: number }[] {
  if (items.length === 0 || segments.length === 0) return [];
  if (segments.length === 1) return layoutWall(segments[0].start, segments[0].end, maxHeight, items, tierOffset);

  const lengths = segments.map((s) => Math.max(0, s.end - s.start));
  const totalLength = lengths.reduce((sum, len) => sum + len, 0) || 1;
  let assigned = 0;
  const counts = lengths.map((len, i) => {
    if (i === lengths.length - 1) return items.length - assigned;
    const count = Math.round((items.length * len) / totalLength);
    assigned += count;
    return count;
  });

  const results: { frameWidth: number; frameHeight: number; center: number }[] = [];
  let cursor = 0;
  segments.forEach((seg, i) => {
    const count = counts[i];
    if (count <= 0) return;
    const slice = items.slice(cursor, cursor + count);
    results.push(...layoutWall(seg.start, seg.end, maxHeight, slice, tierOffset + cursor));
    cursor += count;
  });
  return results;
}

/**
 * Auto-places artwork evenly across an arbitrary set of (room, wall) slots,
 * round-robin bucketed the same way a single room's walls are -- generalized
 * from what used to be single-room-only so the multi-room layouts (see
 * generateLShapeMuseum / generateCrossMuseum below) can spread pieces across
 * every gallery in the floor plan, not just one room's three walls. Any
 * target wall that has a doorway opening on it still gets its share --
 * `wallSegments` finds whatever solid run(s) remain beside the opening --
 * rather than being skipped outright, so a room with multiple connectors
 * (e.g. a cross layout's main gallery) doesn't lose most of its wall space
 * to doorways the way a hardcoded "skip any wall with an opening" rule
 * would.
 */
export function layoutArtworksAcrossWalls(
  wallTargets: { room: GalleryRoom; wall: WallSide }[],
  inputs: UploadedArtworkInput[]
): Artwork[] {
  if (wallTargets.length === 0) return [];
  const buckets: UploadedArtworkInput[][] = wallTargets.map(() => []);
  inputs.forEach((input, i) => buckets[i % wallTargets.length].push(input));

  const artworks: Artwork[] = [];
  wallTargets.forEach(({ room, wall }, targetIndex) => {
    const bucket = buckets[targetIndex];
    if (bucket.length === 0) return;
    const [spanMin, spanMax] = wallSpan(room, wall);
    const opening = room.openings.find((o) => o.wall === wall);
    const { segments } = wallSegments(spanMin, spanMax, opening);
    const maxHeight = room.height * 0.56;
    const laidOut = layoutWallSegments(segments, maxHeight, bucket, artworks.length);

    bucket.forEach((input, i) => {
      const laid = laidOut[i];
      if (!laid) return;
      const { frameWidth, frameHeight, center } = laid;
      const { wallPosition, interactionZone } = placeOnWall(room, wall, center);
      artworks.push({
        id: input.id,
        title: input.title,
        artist: input.artist,
        year: input.year,
        medium: input.medium,
        description: input.description,
        altText: input.altText,
        imageUrl: input.imageUrl,
        imageAspectRatio: input.imageAspectRatio,
        displayOrder: artworks.length + 1,
        wallPosition,
        interactionZone,
        frameWidth,
        frameHeight,
      });
    });
  });

  return artworks;
}

/**
 * Auto-places artwork evenly across three walls of an *already-fixed* room
 * (the fourth wall -- by convention, south -- is assumed to hold the
 * entrance and is never hung). Split out of `generateSingleRoomMuseum` so a
 * room whose bounds/openings are hand-authored (e.g. a custom Blender
 * model, see `GalleryRoom.modelUrl`) can still re-run this same placement
 * whenever artwork is added or removed, without its shape ever being
 * recomputed -- see `server/museumLayout.ts`'s `relayoutMuseum`.
 */
export function layoutArtworksForRoom(room: GalleryRoom, inputs: UploadedArtworkInput[]): Artwork[] {
  return layoutArtworksAcrossWalls(
    WALLS.map((wall) => ({ room, wall })),
    inputs
  );
}

/**
 * Builds a single, compact gallery room -- a snug ~6.5x6.5, only growing
 * beyond that if a full 4 pieces genuinely can't fit at the minimum
 * comfortably -- and auto-places pieces evenly across three walls (the
 * fourth holds the entrance). This is the smallest of the three size tiers
 * (see `generateMuseumLayout` below); it's only ever reached for a handful
 * of pieces, so it stays deliberately small rather than the generous
 * one-size-fits-all room this used to be for every museum regardless of
 * collection size.
 *
 * 6.5x6.5, not a literal 4x4 -- two problems with going any smaller, both
 * found by actually walking the smaller room rather than just eyeballing
 * the numbers:
 *
 * 1. The third-person camera rig (see game/camera/thirdPersonCamera.ts's
 *    DISTANCE/MIN_DISTANCE) wants roughly 4.6 units of follow distance and
 *    was tuned against rooms no smaller than the demo's own ~5.5-wide
 *    alcoves; a true 4x4 leaves less than half that available in any
 *    direction from center, which pinned the camera to its hard
 *    MIN_DISTANCE floor almost everywhere in the room -- a persistently
 *    tight, clipped-in view rather than a cozy one.
 * 2. MuseumRoom's auto-placed furnishings (sculpture, rug, two columns,
 *    chandelier) are sized/spaced for a normal-size room and aren't aware
 *    of how small this tier's room is -- at 5.5x5.5 the rug and the two
 *    columns ended up nearly touching, which alongside four wall-mounted
 *    frames and a shadow-casting chandelier packed that much geometry
 *    overlap into that little space tightly enough to occasionally destabilize
 *    the renderer. 6.5x6.5 gives the same fixed decor real clearance without
 *    changing MuseumRoom's placement logic itself.
 */
export function generateSingleRoomMuseum({
  id,
  ownerId,
  name,
  description,
  theme,
  artworks: inputs,
}: GenerateSingleRoomMuseumInput): Museum {
  const perWall = Math.max(1, Math.ceil(inputs.length / WALLS.length));
  const width = Math.max(6.5, perWall * 1.3 + 1.6);
  const depth = Math.max(6.5, perWall * 1.3 + 1.6);
  const height = 4.2;
  const entranceWidth = 2.2;

  const room: GalleryRoom = {
    id: "main",
    name,
    theme,
    bounds: { minX: -width / 2, maxX: width / 2, minZ: -depth / 2, maxZ: depth / 2 },
    height,
    openings: [{ wall: "south", center: 0, width: entranceWidth, isEntrance: true }],
  };

  const artworks = layoutArtworksForRoom(room, inputs);

  return {
    id,
    ownerId,
    name,
    description,
    artworks,
    spawnPoint: { x: 0, y: 0, z: depth / 2 - 1.6 },
    rooms: [room],
    openingConnectors: [],
  };
}
