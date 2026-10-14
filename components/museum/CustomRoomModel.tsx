"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * Renders a Blender-exported .glb as a room's decorative geometry, in place
 * of the procedural Floor/Walls. Purely visual -- the room's `bounds`/
 * `height`/`openings` (see types/museum.ts) still drive collision, camera
 * clamping, artwork wall placement, and lighting, so the model's own walls
 * must be hand-aligned to match those numbers.
 *
 * `scene.clone()` guards against two rooms ever sharing the same
 * modelUrl -- useGLTF caches and reuses one Object3D per url, and a single
 * Object3D can't exist at two positions in the scene graph at once.
 */
export function CustomRoomModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [model]);

  return <primitive object={model} />;
}

/** Warms drei's useGLTF cache for a known room model ahead of render --
 * optional, call from wherever a museum's model url is first known (e.g. a
 * page-level effect) to avoid a load flash the first time the room mounts. */
export function preloadRoomModel(url: string) {
  useGLTF.preload(url);
}
