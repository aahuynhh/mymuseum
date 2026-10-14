import type { GalleryRoom, Museum, RoomBounds, WallSide } from "@/types";
import type { GalleryThemeId } from "./themes";
import {
  generateSingleRoomMuseum,
  layoutArtworksAcrossWalls,
  type GenerateSingleRoomMuseumInput,
  type UploadedArtworkInput,
} from "./autoLayout";

export interface GenerateMultiRoomMuseumInput {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  theme: GalleryThemeId;
  artworks: UploadedArtworkInput[];
}

/**
 * Reorders a flat (room, wall) target list so consecutive entries cycle
 * through different rooms round-robin, instead of exhausting one room's
 * walls before ever reaching the next room's. `layoutArtworksAcrossWalls`
 * buckets artwork onto targets in the order given, one-per-target on the
 * first pass -- if the targets are grouped room-by-room (as they're
 * naturally written below: all of the entrance's walls, then all of main's,
 * etc.) and there are fewer artworks than total wall targets, whichever
 * room's targets come last in that list can end up with zero artwork at
 * all, even though every other room got several. Interleaving so every
 * room gets a turn before any room gets a second wall means every room
 * with at least one target gets at least one piece as soon as the artwork
 * count reaches the room count -- five wall targets in, five rooms
 * covered -- long before it's anywhere near enough to fill every wall.
 */
function interleaveByRoom<T extends { room: GalleryRoom }>(targets: T[]): T[] {
  const byRoom = new Map<GalleryRoom, T[]>();
  for (const target of targets) {
    const list = byRoom.get(target.room);
    if (list) list.push(target);
    else byRoom.set(target.room, [target]);
  }
  const roomLists = [...byRoom.values()];
  const result: T[] = [];
  for (let i = 0; result.length < targets.length; i++) {
    for (const list of roomLists) {
      if (i < list.length) result.push(list[i]);
    }
  }
  return result;
}

/**
 * A small collision-only rectangle bridging a doorway between two rooms
 * (see `Museum.openingConnectors`), built from the shared wall coordinate
 * and the opening cut into it -- the same relationship the hand-authored
 * `data/rooms.ts` DEMO_CONNECTORS keep in sync by hand for the demo museum.
 * `axis` is which axis the shared wall runs *along* (so a connector between
 * an east and a west wall, which both sit at a fixed x, runs along z).
 */
function buildConnector(
  axis: "x" | "z",
  sharedCoord: number,
  openingCenter: number,
  openingWidth: number
): RoomBounds {
  const half = openingWidth / 2 + 0.3;
  return axis === "z"
    ? { minX: sharedCoord - 0.8, maxX: sharedCoord + 0.8, minZ: openingCenter - half, maxZ: openingCenter + half }
    : { minX: openingCenter - half, maxX: openingCenter + half, minZ: sharedCoord - 0.8, maxZ: sharedCoord + 0.8 };
}

/**
 * A compact two-room floor plan -- a squarish main room with a smaller wing
 * attached to only *part* of one wall, so the combined footprint reads as
 * an L from above rather than one plain rectangle. For 5-9 artworks: enough
 * to want more than the small tier's single 4x4 room, not enough to want
 * the large tier's full 5-room cross.
 *
 * Fixed at one size rather than scaled to the artwork count -- the whole
 * 5-9 range fits comfortably across this L's 5 available walls (see
 * WALL_TARGETS below) without crowding, the same way the demo's hand-sized
 * rooms don't resize themselves as artwork is swapped in and out.
 */
export function generateLShapeMuseum({
  id,
  ownerId,
  name,
  description,
  theme,
  artworks: inputs,
}: GenerateMultiRoomMuseumInput): Museum {
  const height = 4.6;
  const entranceWidth = 2.2;

  // "main" is the entrance room -- a 7x7 square, door on the south wall.
  const mainBounds: RoomBounds = { minX: -3.5, maxX: 3.5, minZ: -3.5, maxZ: 3.5 };
  // "wing" attaches to only the north half of main's east wall (z from
  // main's minZ to its center), leaving the south half of that wall solid
  // and un-opened -- that's what makes the combined footprint an L instead
  // of just a wider rectangle.
  const wingBounds: RoomBounds = { minX: 3.5, maxX: 9, minZ: -3.5, maxZ: 0 };
  const connectorCenter = -1.75; // z, the midpoint of main's north-half wall segment
  const connectorWidth = 2.6;

  const main: GalleryRoom = {
    id: "main",
    name,
    theme,
    bounds: mainBounds,
    height,
    openings: [
      { wall: "south", center: 0, width: entranceWidth, isEntrance: true },
      { wall: "east", center: connectorCenter, width: connectorWidth },
    ],
  };
  const wing: GalleryRoom = {
    id: "wing",
    name: `${name} Wing`,
    theme,
    bounds: wingBounds,
    height,
    openings: [{ wall: "west", center: connectorCenter, width: connectorWidth }],
  };

  const connector = buildConnector("z", mainBounds.maxX, connectorCenter, connectorWidth);

  const wallTargets: { room: GalleryRoom; wall: WallSide }[] = interleaveByRoom([
    { room: main, wall: "north" },
    { room: main, wall: "west" },
    { room: wing, wall: "north" },
    { room: wing, wall: "east" },
    { room: wing, wall: "south" },
  ]);
  const artworks = layoutArtworksAcrossWalls(wallTargets, inputs);

  return {
    id,
    ownerId,
    name,
    description,
    artworks,
    spawnPoint: { x: 0, y: 0, z: mainBounds.maxZ - 2 },
    rooms: [main, wing],
    openingConnectors: [connector],
  };
}

/**
 * A five-room floor plan -- entrance, a large main gallery, two side wings,
 * and a far room -- arranged in the same cross/plus shape as the hand-built
 * demo museum (data/rooms.ts). For 10+ artworks: the main gallery alone
 * exposes four walls' worth of space (each with its own connector, but each
 * connector only eats a few units out of a much longer wall -- see
 * WALL_TARGETS), so this tier keeps real capacity well past 10 pieces
 * without ever needing to resize -- the geometry is a fixed floor plan, only
 * how many pieces land on each wall changes.
 *
 * Bounds/opening/connector numbers deliberately mirror data/rooms.ts's
 * DEMO_ROOMS proportions (reused, not reinvented) -- that exact geometry is
 * already verified to render without seams or gaps at every doorway.
 */
export function generateCrossMuseum({
  id,
  ownerId,
  name,
  description,
  theme,
  artworks: inputs,
}: GenerateMultiRoomMuseumInput): Museum {
  const height = 4.8;

  const entranceBounds: RoomBounds = { minX: -4, maxX: 4, minZ: 3.5, maxZ: 9.5 };
  const mainBounds: RoomBounds = { minX: -9, maxX: 9, minZ: -6, maxZ: 3.5 };
  const westWingBounds: RoomBounds = { minX: -14, maxX: -9, minZ: -3, maxZ: 1 };
  const eastWingBounds: RoomBounds = { minX: 9, maxX: 14, minZ: -3, maxZ: 1 };
  const farRoomBounds: RoomBounds = { minX: -7, maxX: 7, minZ: -14, maxZ: -6 };

  const entranceMainCenter = 0;
  const entranceMainWidth = 3.2;
  const mainWestCenter = -1;
  const mainWestWidth = 2.8;
  const mainEastCenter = -1;
  const mainEastWidth = 2.8;
  const mainFarCenter = 0;
  const mainFarWidth = 3.4;

  const entrance: GalleryRoom = {
    id: "entrance",
    name: "Entrance Hall",
    theme,
    bounds: entranceBounds,
    height,
    openings: [
      { wall: "south", center: 0, width: 2.4, isEntrance: true },
      { wall: "north", center: entranceMainCenter, width: entranceMainWidth },
    ],
  };
  const main: GalleryRoom = {
    id: "main",
    name,
    theme,
    bounds: mainBounds,
    height,
    openings: [
      { wall: "south", center: entranceMainCenter, width: entranceMainWidth },
      { wall: "west", center: mainWestCenter, width: mainWestWidth },
      { wall: "east", center: mainEastCenter, width: mainEastWidth },
      { wall: "north", center: mainFarCenter, width: mainFarWidth },
    ],
  };
  const westWing: GalleryRoom = {
    id: "west-wing",
    name: `${name} West Wing`,
    theme,
    bounds: westWingBounds,
    height,
    openings: [{ wall: "east", center: mainWestCenter, width: mainWestWidth }],
  };
  const eastWing: GalleryRoom = {
    id: "east-wing",
    name: `${name} East Wing`,
    theme,
    bounds: eastWingBounds,
    height,
    openings: [{ wall: "west", center: mainEastCenter, width: mainEastWidth }],
  };
  const farRoom: GalleryRoom = {
    id: "far-room",
    name: `${name} Far Room`,
    theme,
    bounds: farRoomBounds,
    height,
    openings: [{ wall: "south", center: mainFarCenter, width: mainFarWidth }],
  };

  const connectors: RoomBounds[] = [
    buildConnector("x", entranceBounds.minZ, entranceMainCenter, entranceMainWidth),
    buildConnector("z", mainBounds.minX, mainWestCenter, mainWestWidth),
    buildConnector("z", mainBounds.maxX, mainEastCenter, mainEastWidth),
    buildConnector("x", mainBounds.minZ, mainFarCenter, mainFarWidth),
  ];

  const wallTargets: { room: GalleryRoom; wall: WallSide }[] = interleaveByRoom([
    { room: entrance, wall: "east" },
    { room: entrance, wall: "west" },
    { room: main, wall: "south" },
    { room: main, wall: "west" },
    { room: main, wall: "east" },
    { room: main, wall: "north" },
    { room: westWing, wall: "north" },
    { room: westWing, wall: "south" },
    { room: westWing, wall: "west" },
    { room: eastWing, wall: "north" },
    { room: eastWing, wall: "south" },
    { room: eastWing, wall: "east" },
    { room: farRoom, wall: "north" },
    { room: farRoom, wall: "east" },
    { room: farRoom, wall: "west" },
    { room: farRoom, wall: "south" },
  ]);
  const artworks = layoutArtworksAcrossWalls(wallTargets, inputs);

  return {
    id,
    ownerId,
    name,
    description,
    artworks,
    spawnPoint: { x: 0, y: 0, z: entranceBounds.maxZ - 2.5 },
    rooms: [entrance, main, westWing, eastWing, farRoom],
    openingConnectors: connectors,
  };
}

/**
 * Picks a floor-plan "size tier" from the artwork count and dispatches to
 * the matching generator, so a museum's shape actually changes as its
 * collection grows instead of one generously-oversized rectangle serving a
 * 3-piece collection and a 50-piece one equally badly:
 *
 * - 1-4 pieces: `generateSingleRoomMuseum` -- one compact ~4x4 room.
 * - 5-9 pieces: `generateLShapeMuseum` -- two connected rooms forming an L.
 * - 10+ pieces: `generateCrossMuseum` -- a five-room cross/plus floor plan,
 *   the same shape as the hand-built demo museum.
 *
 * This is what both the create flow (app/api/museums/route.ts) and
 * `server/museumLayout.ts`'s `relayoutMuseum` call -- so a museum's shape
 * is recomputed, and can cross tiers, every time artwork is added or
 * removed, the same way its single-room size already did before tiers
 * existed. A room with hand-authored bounds (`GalleryRoom.modelUrl`) never
 * goes through this at all -- see relayoutMuseum's early branch, which
 * calls `layoutArtworksForRoom` directly instead.
 */
export function generateMuseumLayout(input: GenerateSingleRoomMuseumInput): Museum {
  const count = input.artworks.length;
  if (count <= 4) return generateSingleRoomMuseum(input);
  if (count <= 9) return generateLShapeMuseum(input);
  return generateCrossMuseum(input);
}
