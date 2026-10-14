import type { Artwork } from "./artwork";
import type { Vector3Tuple } from "./player";
import type { GalleryThemeId } from "@/game/museum/themes";

export interface RoomBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export type WallSide = "north" | "south" | "east" | "west";

export interface WallOpening {
  wall: WallSide;
  /** Center of the opening along that wall (x for north/south walls, z for east/west walls) */
  center: number;
  width: number;
  /** True for the museum's single front door (renders a doorframe, not a picture-rail-matched archway) */
  isEntrance?: boolean;
}

export interface GalleryRoom {
  id: string;
  name: string;
  theme: GalleryThemeId;
  bounds: RoomBounds;
  height: number;
  openings: WallOpening[];
  /** Path to a Blender-exported .glb (e.g. "/models/my-room.glb") used as this
   * room's decorative geometry instead of the procedural box (Floor/Walls).
   * Purely visual -- collision, camera clamping, artwork wall placement, and
   * lighting all still work off `bounds`/`height`/`openings` alone, so the
   * model's actual walls must be hand-aligned to match those numbers. */
  modelUrl?: string;
}

export interface Museum {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  artworks: Artwork[];
  spawnPoint: Vector3Tuple;
  /** Connected gallery rooms making up the museum's floor plan. */
  rooms: GalleryRoom[];
  /**
   * Small collision-only rectangles bridging each doorway between rooms, so
   * movement/camera bounds stay smooth crossing a threshold even though the
   * two rooms' (independently wall-margined) bounds don't literally touch.
   */
  openingConnectors: RoomBounds[];
}

