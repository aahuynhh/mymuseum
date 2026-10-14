"use client";

import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AvatarModel } from "@/components/avatar/AvatarModel";
import { useKeyState } from "@/game/controls/useKeyState";
import { stepMovement } from "@/game/controls/movement";
import { clampToFloorPlan } from "@/game/collision/roomBounds";
import { computeCameraTarget } from "@/game/camera/thirdPersonCamera";
import { usePointerOrbit } from "@/game/camera/usePointerOrbit";
import { findNearbyArtwork } from "@/game/interaction/proximity";
import type { AnimationState, AvatarConfiguration, Museum, Vector3Tuple } from "@/types";

const EMIT_INTERVAL = 0.1; // seconds, throttles outgoing multiplayer updates to ~10Hz

interface PlayerControllerProps {
  museum: Museum;
  avatarConfig: AvatarConfiguration;
  spawnPoint: Vector3Tuple;
  controlsEnabled: boolean;
  onNearbyArtworkChange: (id: string | null) => void;
  onTransformUpdate?: (transform: {
    position: Vector3Tuple;
    rotation: number;
    animationState: AnimationState;
  }) => void;
}

export function PlayerController({
  museum,
  avatarConfig,
  spawnPoint,
  controlsEnabled,
  onNearbyArtworkChange,
  onTransformUpdate,
}: PlayerControllerProps) {
  const { camera, gl } = useThree();
  const keysRef = useKeyState(controlsEnabled);
  const orbitRef = usePointerOrbit(gl.domElement, true, 0);

  const positionRef = useRef(new THREE.Vector3(spawnPoint.x, spawnPoint.y, spawnPoint.z));
  const velocityRef = useRef(new THREE.Vector3());
  const facingRef = useRef(Math.PI);
  const lookAtRef = useRef(new THREE.Vector3());
  const cameraInitialized = useRef(false);
  const avatarGroup = useRef<THREE.Group>(null);
  const lastNearby = useRef<string | null>(null);
  const emitAccumulator = useRef(0);

  const [animationState, setAnimationState] = useState<AnimationState>("idle");
  const lastAnimState = useRef<AnimationState>("idle");

  useFrame((_state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const moveState = {
      position: positionRef.current,
      velocity: velocityRef.current,
      facing: facingRef.current,
    };
    const { isMoving } = stepMovement(moveState, keysRef.current, orbitRef.current.yaw, delta);
    facingRef.current = moveState.facing;

    const clamped = clampToFloorPlan(
      positionRef.current.x,
      positionRef.current.z,
      museum.rooms,
      museum.openingConnectors
    );
    positionRef.current.x = clamped.x;
    positionRef.current.z = clamped.z;

    if (avatarGroup.current) {
      avatarGroup.current.position.set(
        positionRef.current.x,
        positionRef.current.y,
        positionRef.current.z
      );
      avatarGroup.current.rotation.y = facingRef.current;
    }

    const nextAnimState: AnimationState = isMoving ? "walking" : "idle";
    if (nextAnimState !== lastAnimState.current) {
      lastAnimState.current = nextAnimState;
      setAnimationState(nextAnimState);
    }

    const camTarget = computeCameraTarget(
      positionRef.current,
      orbitRef.current,
      museum.rooms,
      museum.openingConnectors
    );
    if (!cameraInitialized.current) {
      camera.position.copy(camTarget.position);
      lookAtRef.current.copy(camTarget.lookAt);
      cameraInitialized.current = true;
    } else {
      camera.position.lerp(camTarget.position, Math.min(1, 7 * delta));
      lookAtRef.current.lerp(camTarget.lookAt, Math.min(1, 10 * delta));
    }
    camera.lookAt(lookAtRef.current);

    const nearby = findNearbyArtwork(positionRef.current.x, positionRef.current.z, museum.artworks);
    if (nearby !== lastNearby.current) {
      lastNearby.current = nearby;
      onNearbyArtworkChange(nearby);
    }

    emitAccumulator.current += delta;
    if (onTransformUpdate && emitAccumulator.current >= EMIT_INTERVAL) {
      emitAccumulator.current = 0;
      onTransformUpdate({
        position: {
          x: positionRef.current.x,
          y: positionRef.current.y,
          z: positionRef.current.z,
        },
        rotation: facingRef.current,
        animationState: nextAnimState,
      });
    }
  });

  return (
    <group ref={avatarGroup} position={[spawnPoint.x, spawnPoint.y, spawnPoint.z]}>
      <AvatarModel config={avatarConfig} animationState={animationState} animate />
    </group>
  );
}
