"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AvatarModel } from "@/components/avatar/AvatarModel";
import type { AnimationState, Player } from "@/types";
import type { RemoteTransformMap } from "@/hooks/useMultiplayer";

interface RemoteAvatarProps {
  player: Player;
  transforms: RemoteTransformMap;
}

/**
 * Renders one remote visitor. Network updates arrive in `transforms` at a
 * throttled rate; this component smoothly interpolates toward the latest
 * received transform every render frame so remote motion never looks choppy.
 */
export function RemoteAvatar({ player, transforms }: RemoteAvatarProps) {
  const group = useRef<THREE.Group>(null);
  const lastAnimState = useRef<AnimationState>(player.animationState);
  const [animationState, setAnimationState] = useState<AnimationState>(player.animationState);

  useFrame((_state, delta) => {
    const target = transforms.get(player.id);
    if (!target || !group.current) return;

    group.current.position.lerp(
      new THREE.Vector3(target.position.x, target.position.y, target.position.z),
      Math.min(1, 10 * delta)
    );

    const current = group.current.rotation.y;
    let diff = target.rotation - current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    group.current.rotation.y = current + diff * Math.min(1, 10 * delta);

    if (target.animationState !== lastAnimState.current) {
      lastAnimState.current = target.animationState;
      setAnimationState(target.animationState);
    }
  });

  return (
    <group
      ref={group}
      position={[player.position.x, player.position.y, player.position.z]}
    >
      <AvatarModel
        config={player.avatarConfiguration}
        animationState={animationState}
        username={player.displayName}
        showLabel
        animate
      />
    </group>
  );
}
