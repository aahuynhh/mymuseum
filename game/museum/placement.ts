import type { GalleryRoom, InteractionZone, WallOpening, WallPosition, WallSide } from "@/types";

const INTERACTION_OFFSET = 1.9;

export interface WallSpanSegment {
  start: number;
  end: number;
}

/**
 * Splits a wall's full span into the solid segment(s) that remain once its
 * one opening (if any) is cut out -- zero, one, or two segments depending on
 * whether the opening sits in the middle or flush against an end. Shared by
 * Walls.tsx (to know where to draw wall/baseboard/crown geometry) and
 * game/museum/autoLayout.ts (to know where artwork is actually allowed to
 * hang -- a wall with a doorway can still take frames in whatever solid
 * segment remains beside it, it just can't use the *whole* span the way a
 * blank wall can).
 */
export function wallSegments(spanMin: number, spanMax: number, opening?: WallOpening) {
  if (!opening) return { segments: [{ start: spanMin, end: spanMax }] as WallSpanSegment[], opening: null };
  const left = opening.center - opening.width / 2;
  const right = opening.center + opening.width / 2;
  const segments: WallSpanSegment[] = [];
  if (left > spanMin + 0.01) segments.push({ start: spanMin, end: left });
  if (right < spanMax - 0.01) segments.push({ start: right, end: spanMax });
  return { segments, opening };
}

/**
 * Computes a wall-mounted artwork's world position/rotation and its
 * interaction trigger zone from a room, a wall side, and a coordinate along
 * that wall -- so hand-authoring gallery layouts (or auto-placing an
 * uploaded museum) doesn't require re-deriving this geometry by hand.
 */
export function placeOnWall(
  room: GalleryRoom,
  side: WallSide,
  along: number,
  y = 1.6
): { wallPosition: WallPosition; interactionZone: InteractionZone } {
  const { bounds } = room;

  switch (side) {
    case "north":
      return {
        wallPosition: { x: along, y, z: bounds.minZ, rotationY: 0 },
        interactionZone: { x: along, z: bounds.minZ + INTERACTION_OFFSET, radius: 1.8 },
      };
    case "south":
      return {
        wallPosition: { x: along, y, z: bounds.maxZ, rotationY: Math.PI },
        interactionZone: { x: along, z: bounds.maxZ - INTERACTION_OFFSET, radius: 1.8 },
      };
    case "east":
      return {
        wallPosition: { x: bounds.maxX, y, z: along, rotationY: -Math.PI / 2 },
        interactionZone: { x: bounds.maxX - INTERACTION_OFFSET, z: along, radius: 1.8 },
      };
    case "west":
      return {
        wallPosition: { x: bounds.minX, y, z: along, rotationY: Math.PI / 2 },
        interactionZone: { x: bounds.minX + INTERACTION_OFFSET, z: along, radius: 1.8 },
      };
  }
}

export function wallSpan(room: GalleryRoom, side: WallSide): [number, number] {
  return side === "north" || side === "south"
    ? [room.bounds.minX, room.bounds.maxX]
    : [room.bounds.minZ, room.bounds.maxZ];
}

/**
 * For a fixture that needs to sit on a wall at two points symmetric about
 * `center` (`center - offset` and `center + offset`), finds the largest
 * offset -- searched from `maxFrac * span` inward down to `minFrac * span`
 * -- where neither point (padded by `fixtureHalfWidth`) overlaps any of the
 * given occupied ranges on that same wall (e.g. artwork frames, each padded
 * with its own clearance when the caller builds `occupied`). Used so a
 * decorative wall fixture (a sconce flanking a room's sign) is never placed
 * blind and risks sitting on top of a piece of art -- this has to be a
 * search, not a fixed fraction of the wall, since artwork position varies
 * per room (hand-authored for the demo museum, auto-computed for a
 * user-created one). Returns null if nothing in range clears every occupied
 * range on both sides, so the caller can skip the fixture entirely rather
 * than force a bad placement.
 */
export function findSymmetricClearOffset(
  center: number,
  span: number,
  occupied: Array<[number, number]>,
  fixtureHalfWidth: number,
  maxFrac = 0.42,
  minFrac = 0.12,
  step = 0.02
): number | null {
  const clear = (x: number) => occupied.every(([lo, hi]) => x + fixtureHalfWidth < lo || x - fixtureHalfWidth > hi);

  for (let frac = maxFrac; frac >= minFrac; frac -= step) {
    const offset = span * frac;
    if (clear(center - offset) && clear(center + offset)) return offset;
  }
  return null;
}
