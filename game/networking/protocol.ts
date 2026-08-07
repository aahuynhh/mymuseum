import type { AnimationState, AvatarConfiguration, Player, Vector3Tuple } from "@/types";

export interface JoinPayload {
  museumId: string;
  username: string;
  displayName: string;
  avatarConfiguration: AvatarConfiguration;
  position: Vector3Tuple;
  rotation: number;
  animationState: AnimationState;
  /** Stable per-browser id; lets the server dedupe rapid reconnects from the same visitor. */
  sessionId: string;
}

export interface TransformPayload {
  position: Vector3Tuple;
  rotation: number;
  animationState: AnimationState;
}

export interface WelcomePayload {
  selfId: string;
  players: Player[];
}

export interface PlayerUpdatePayload {
  id: string;
  position: Vector3Tuple;
  rotation: number;
  animationState: AnimationState;
}

export interface ServerToClientEvents {
  welcome: (data: WelcomePayload) => void;
  "player:joined": (player: Player) => void;
  "player:update": (data: PlayerUpdatePayload) => void;
  "player:left": (data: { id: string }) => void;
  "visitor:count": (count: number) => void;
}

export interface ClientToServerEvents {
  join: (data: JoinPayload) => void;
  transform: (data: TransformPayload) => void;
  "museum:peek": (museumId: string) => void;
}
