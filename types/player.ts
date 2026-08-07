import type { AvatarConfiguration } from "./avatar";

export type AnimationState = "idle" | "walking";

export interface Vector3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface Player {
  id: string;
  username: string;
  displayName: string;
  avatarConfiguration: AvatarConfiguration;
  position: Vector3Tuple;
  /** Y-axis rotation in radians */
  rotation: number;
  animationState: AnimationState;
  museumId: string;
}

/** Payload the client streams to the server; server stamps id/museumId. */
export type PlayerTransformUpdate = Pick<Player, "position" | "rotation" | "animationState">;
