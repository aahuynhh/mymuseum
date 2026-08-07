import type { GalleryRoom, InteractionZone, WallPosition, WallSide } from "@/types";

const INTERACTION_OFFSET = 1.9;

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
