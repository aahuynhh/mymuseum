import * as THREE from "three";
import type { GalleryRoom, RoomBounds, WallOpening, WallSide } from "@/types";
import { findCurrentRoom } from "@/game/collision/roomBounds";

export interface OrbitState {
  yaw: number;
  pitch: number;
}

const DISTANCE = 4.6;
const MIN_DISTANCE = 1.4;
const CAMERA_WALL_MARGIN = 0.35;
const BASE_HEIGHT = 2.4;
const LOOK_HEIGHT = 1.1;
export const MIN_PITCH = -0.25;
export const MAX_PITCH = 0.55;

/** True when `crossCoord` (the other axis's value where a ray crosses a
 * wall plane) falls inside that wall's doorway opening, if it has one. */
function crossesOpening(crossCoord: number, side: WallSide, openings: WallOpening[]): boolean {
  const opening = openings.find((o) => o.wall === side);
  if (!opening) return false;
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
 */
export function computeCameraTarget(
  targetPosition: THREE.Vector3,
  orbit: OrbitState,
  rooms: GalleryRoom[]
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

  const position = new THREE.Vector3(
    targetPosition.x + back.x * distance,
    pitchHeight,
    targetPosition.z + back.z * distance
  );

  const lookAt = new THREE.Vector3(
    targetPosition.x,
    targetPosition.y + LOOK_HEIGHT,
    targetPosition.z
  );

  return { position, lookAt };
}
