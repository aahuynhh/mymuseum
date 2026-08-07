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

export interface ArtistProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  disciplines: string[];
  museumId: string;
}
