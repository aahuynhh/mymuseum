import * as THREE from "three";
import type { KeyState } from "./useKeyState";

export const MAX_SPEED = 3.2;
const ACCELERATION = 18;
const DECELERATION = 22;
const TURN_SPEED = 12;

export interface MovementState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  facing: number;
}

/**
 * Advances velocity and position for one frame given the current input and
 * camera yaw (movement is camera-relative: "forward" is away from the
 * camera, matching a cozy third-person controller rather than tank controls).
 */
export function stepMovement(
  state: MovementState,
  keys: KeyState,
  cameraYaw: number,
  delta: number
) {
  const forwardVec = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
  const rightVec = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);

  const inputForward = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0);
  const inputRight = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);

  const moveDir = new THREE.Vector3();
  moveDir.addScaledVector(forwardVec, inputForward);
  moveDir.addScaledVector(rightVec, inputRight);
  const hasInput = moveDir.lengthSq() > 0;
  if (hasInput) moveDir.normalize();

  const targetVelocity = moveDir.multiplyScalar(MAX_SPEED);
  const rate = hasInput ? ACCELERATION : DECELERATION;
  state.velocity.lerp(targetVelocity, Math.min(1, rate * delta));

  if (state.velocity.lengthSq() < 0.0004) {
    state.velocity.set(0, 0, 0);
  }

  state.position.x += state.velocity.x * delta;
  state.position.z += state.velocity.z * delta;

  if (state.velocity.lengthSq() > 0.02) {
    const targetFacing = Math.atan2(state.velocity.x, state.velocity.z);
    state.facing = lerpAngle(state.facing, targetFacing, Math.min(1, TURN_SPEED * delta));
  }

  const speed = state.velocity.length();
  return { speed, isMoving: speed > 0.15 };
}

function lerpAngle(from: number, to: number, t: number) {
  let diff = to - from;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return from + diff * t;
}
