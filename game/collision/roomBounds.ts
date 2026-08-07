import type { GalleryRoom, RoomBounds } from "@/types";

const AVATAR_RADIUS = 0.35;
const WALL_MARGIN = 0.25;
const MARGIN = AVATAR_RADIUS + WALL_MARGIN;

function shrink(bounds: RoomBounds): RoomBounds {
  return {
    minX: bounds.minX + MARGIN,
    maxX: bounds.maxX - MARGIN,
    minZ: bounds.minZ + MARGIN,
    maxZ: bounds.maxZ - MARGIN,
  };
}

function isInside(x: number, z: number, bounds: RoomBounds): boolean {
  return x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ;
}

function clampInto(x: number, z: number, bounds: RoomBounds) {
  const cx = Math.min(bounds.maxX, Math.max(bounds.minX, x));
  const cz = Math.min(bounds.maxZ, Math.max(bounds.minZ, z));
  return { x: cx, z: cz, dist: (cx - x) ** 2 + (cz - z) ** 2 };
}

/**
 * Clamps a proposed (x, z) position to stay within the museum's floor plan
 * -- a set of connected rectangular rooms plus small connector rectangles
 * that bridge each doorway. If the point already sits inside any of those
 * shapes it's returned unchanged; otherwise it's pulled to the nearest edge
 * of whichever shape is closest, so movement along a wall (or through a
 * doorway) stays smooth instead of snapping.
 */
export function clampToFloorPlan(
  x: number,
  z: number,
  rooms: GalleryRoom[],
  connectors: RoomBounds[] = []
): { x: number; z: number } {
  const shapes = [...rooms.map((r) => shrink(r.bounds)), ...connectors];

  for (const shape of shapes) {
    if (isInside(x, z, shape)) return { x, z };
  }

  let best = { x, z, dist: Infinity };
  for (const shape of shapes) {
    const candidate = clampInto(x, z, shape);
    if (candidate.dist < best.dist) best = candidate;
  }
  return { x: best.x, z: best.z };
}

/** Finds which room's (shrunk) bounds currently contain (x, z), if any. */
export function findCurrentRoom(x: number, z: number, rooms: GalleryRoom[]): GalleryRoom | null {
  for (const room of rooms) {
    if (isInside(x, z, room.bounds)) return room;
  }
  return rooms[0] ?? null;
}
