import type { GalleryRoom, RoomBounds } from "@/types";

/**
 * Five connected galleries around a central hall, each with its own theme --
 * an entrance foyer opens into a large Museum Blue main gallery, which in
 * turn branches to two smaller side alcoves and a dramatic charcoal room at
 * the far end. Openings (not full walls) connect each pair of rooms so the
 * museum reveals itself as you walk rather than being visible all at once.
 *
 * Lives in its own module (rather than data/museum.ts) so data/artworks.ts
 * can reference room bounds when placing frames without a circular import.
 *
 * Every pair of adjacent rooms shares one exact wall coordinate (e.g. the
 * entrance's north wall and the main gallery's south wall both sit at
 * z=3.5). Each room still renders its OWN wall there in its OWN theme color
 * (see Walls.tsx) -- an earlier version had one room "own" the shared wall
 * and the other render nothing, which avoided z-fighting but meant the
 * leaf room's doorway always showed the *other* room's wall color bleeding
 * through. Walls.tsx instead keeps each room's wall entirely within its own
 * half of the shared thickness, so the two are adjacent, not coplanar.
 *
 * All rooms also share ONE `height` (see ROOM_HEIGHT below). Since
 * main-gallery connects to every other room, any height difference between
 * it and a leaf room produces a visible step where the two rooms' walls
 * meet at the doorway corner -- a real geometric seam, not a shading
 * artifact, and the only fix is for every connected room to agree on one
 * ceiling height.
 */
const ROOM_HEIGHT = 4.8;
export const DEMO_ROOMS: GalleryRoom[] = [
  {
    id: "entrance",
    name: "Entrance Hall",
    theme: "linen",
    bounds: { minX: -4, maxX: 4, minZ: 3.5, maxZ: 10 },
    height: ROOM_HEIGHT,
    openings: [
      { wall: "south", center: 0, width: 2.4, isEntrance: true },
      { wall: "north", center: 0, width: 3.2 },
    ],
  },
  {
    id: "main-gallery",
    name: "Main Gallery",
    theme: "museum-blue",
    bounds: { minX: -9.5, maxX: 9.5, minZ: -6, maxZ: 3.5 },
    height: ROOM_HEIGHT,
    openings: [
      { wall: "south", center: 0, width: 3.2 },
      { wall: "west", center: -1, width: 2.8 },
      { wall: "east", center: -1, width: 2.8 },
      { wall: "north", center: 0, width: 3.4 },
    ],
  },
  {
    id: "west-alcove",
    name: "West Wing",
    theme: "sage",
    bounds: { minX: -15, maxX: -9.5, minZ: -3, maxZ: 1 },
    height: ROOM_HEIGHT,
    openings: [{ wall: "east", center: -1, width: 2.8 }],
  },
  {
    id: "east-alcove",
    name: "East Wing",
    theme: "terracotta",
    bounds: { minX: 9.5, maxX: 15, minZ: -3, maxZ: 1 },
    height: ROOM_HEIGHT,
    openings: [{ wall: "west", center: -1, width: 2.8 }],
  },
  {
    id: "north-gallery",
    name: "The Far Room",
    theme: "charcoal",
    bounds: { minX: -7, maxX: 7, minZ: -14, maxZ: -6 },
    height: ROOM_HEIGHT,
    openings: [{ wall: "south", center: 0, width: 3.4 }],
  },
];

export const DEMO_CONNECTORS: RoomBounds[] = [
  { minX: -1.6, maxX: 1.6, minZ: 2.8, maxZ: 4.2 }, // entrance <-> main gallery
  { minX: -10.3, maxX: -8.7, minZ: -2.4, maxZ: 0.4 }, // main gallery <-> west wing
  { minX: 8.7, maxX: 10.3, minZ: -2.4, maxZ: 0.4 }, // main gallery <-> east wing
  { minX: -1.7, maxX: 1.7, minZ: -6.8, maxZ: -5.2 }, // main gallery <-> far room
];

export function getRoom(id: string): GalleryRoom {
  const room = DEMO_ROOMS.find((r) => r.id === id);
  if (!room) throw new Error(`Unknown demo room id: ${id}`);
  return room;
}
