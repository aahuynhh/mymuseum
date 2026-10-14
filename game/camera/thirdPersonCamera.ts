import * as THREE from "three";
import type { GalleryRoom, RoomBounds, WallOpening, WallSide } from "@/types";
import { clampToFloorPlan, findCurrentRoom } from "@/game/collision/roomBounds";

export interface OrbitState {
  yaw: number;
  pitch: number;
}

const DISTANCE = 4.6;
const MIN_DISTANCE = 1.4;
const CAMERA_WALL_MARGIN = 0.35;
const BASE_HEIGHT = 2.2;
// Lowered from the old humanoid avatar's ~1.1 (roughly its head height) to
// match the new geometric shape-characters' shorter, head-and-body-merged
// silhouette (~1.16 total) -- keeps the follow camera looking at the
// character's body rather than well above its head.
const LOOK_HEIGHT = 0.72;
export const MIN_PITCH = -0.25;
export const MAX_PITCH = 0.55;

/** True when `crossCoord` (the other axis's value where a ray crosses a
 * wall plane) falls inside that wall's doorway opening, if it has one --
 * except the museum's single front `isEntrance` door, which is excluded on
 * purpose. Every other opening connects to a real adjacent room, so letting
 * the camera's distance clamp skip past it (below) is what keeps the
 * follow camera from hiccuping at a normal room threshold. The entrance
 * door doesn't connect to anything -- it's a dead end to unrendered exterior
 * space -- so skipping the clamp there let the camera fly outside the
 * building entirely when a visitor looked back toward the entrance from
 * just inside it, landing the camera looking at walls' un-rendered back
 * faces from outside (reported as the wall trim "flickering from the
 * outside"). */
function crossesOpening(crossCoord: number, side: WallSide, openings: WallOpening[]): boolean {
  const opening = openings.find((o) => o.wall === side);
  if (!opening || opening.isEntrance) return false;
  return crossCoord >= opening.center - opening.width / 2 && crossCoord <= opening.center + opening.width / 2;
}

/**
 * How far the camera can travel from `origin` along the unit direction
 * (dirX, dirZ) before it would pass through a *solid* wall of the room the
 * player currently stands in. Used as a "spring arm" length clamp so the
 * camera pulls in toward the player near a wall instead of being
 * repositioned to an unrelated point in the room (which broke the follow
 * relationship entirely). Each axis's clamp is skipped when the ray would
 * actually cross through that wall's doorway opening rather than solid
 * wall -- without this, the camera pulled in early right at every
 * threshold, reading as a jarring "hiccup" while walking between rooms.
 */
function maxDistanceInsideRoom(
  originX: number,
  originZ: number,
  dirX: number,
  dirZ: number,
  bounds: RoomBounds,
  openings: WallOpening[]
) {
  const minX = bounds.minX + CAMERA_WALL_MARGIN;
  const maxX = bounds.maxX - CAMERA_WALL_MARGIN;
  const minZ = bounds.minZ + CAMERA_WALL_MARGIN;
  const maxZ = bounds.maxZ - CAMERA_WALL_MARGIN;
  let maxT = Infinity;

  if (Math.abs(dirX) > 1e-6) {
    const goingPositive = dirX > 0;
    const bound = goingPositive ? maxX : minX;
    const t = (bound - originX) / dirX;
    const crossZ = originZ + dirZ * t;
    const side: WallSide = goingPositive ? "east" : "west";
    if (!crossesOpening(crossZ, side, openings)) {
      maxT = Math.min(maxT, t);
    }
  }
  if (Math.abs(dirZ) > 1e-6) {
    const goingPositive = dirZ > 0;
    const bound = goingPositive ? maxZ : minZ;
    const t = (bound - originZ) / dirZ;
    const crossX = originX + dirX * t;
    const side: WallSide = goingPositive ? "south" : "north";
    if (!crossesOpening(crossX, side, openings)) {
      maxT = Math.min(maxT, t);
    }
  }

  return Math.max(MIN_DISTANCE, maxT);
}

/**
 * Computes a desired third-person camera position/look-at for a target
 * (the player) given an orbit yaw/pitch. The camera stays behind the player
 * at `DISTANCE`, shortening that distance (rather than relocating the
 * camera) whenever a wall of their current room is closer, so it never
 * clips through geometry.
 *
 * `connectors` feeds a final `clampToFloorPlan` pass over the computed
 * (x, z) -- the same shape (rooms + doorway-bridging connector rectangles)
 * the player's own movement is clamped to in PlayerController.tsx. The
 * per-axis `maxDistanceInsideRoom` clamp above only reasons about crossing
 * one wall plane at a time; near a room corner, at some orbit angles the two
 * axes' independent clamps can each individually look fine while the
 * *combined* diagonal position still lands just past the corner, outside
 * every room and every connector -- putting the camera somewhere nothing is
 * modeled to be seen from, which read as random black voids and "flickering
 * geometry" (actually just walls' un-rendered back faces and finite floor
 * plane edges) rather than what it actually was, a camera positioning bug.
 * This is a hard backstop for exactly that case, not a replacement for the
 * distance clamp above -- the per-room clamp still does the normal-case work
 * of pulling the camera in smoothly near a wall.
 */
export function computeCameraTarget(
  targetPosition: THREE.Vector3,
  orbit: OrbitState,
  rooms: GalleryRoom[],
  connectors: RoomBounds[] = []
) {
  const pitchHeight = BASE_HEIGHT + orbit.pitch * 3.2;
  const back = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), orbit.yaw);

  const currentRoom = findCurrentRoom(targetPosition.x, targetPosition.z, rooms);
  const allowedDistance = currentRoom
    ? maxDistanceInsideRoom(
        targetPosition.x,
        targetPosition.z,
        back.x,
        back.z,
        currentRoom.bounds,
        currentRoom.openings
      )
    : DISTANCE;
  const distance = Math.min(DISTANCE, allowedDistance);

  const rawX = targetPosition.x + back.x * distance;
  const rawZ = targetPosition.z + back.z * distance;
  const safe = clampToFloorPlan(rawX, rawZ, rooms, connectors);

  const position = new THREE.Vector3(safe.x, pitchHeight, safe.z);

  const lookAt = new THREE.Vector3(
    targetPosition.x,
    targetPosition.y + LOOK_HEIGHT,
    targetPosition.z
  );

  return { position, lookAt };
}
