"use client";

import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { RoomBounds } from "@/types";

// A lighter, less saturated derivative of wood-base.png (same source photo
// Walls.tsx's trim also uses) -- the original read as a dark, richly
// saturated mahogany, which was too harsh/heavy for a room-filling floor at
// this scale even after tinting. A dedicated floor variant (rather than
// lightening wood-base.png itself) keeps the trim's own darker wood tone
// untouched.
const FLOOR_TEXTURE_URL = "/textures/floors/floor-wood-light.png";
/** A single normal map combining two things that don't otherwise fit in
 * one material: the wood's own real photographed grain (reused from
 * wood-normal.png, same as Walls.tsx's trim) blended together with a
 * procedurally generated plank-seam pattern (recessed grooves + staggered
 * end-joints -- public/textures/CREDITS.md), via a UDN normal blend baked
 * into this one texture at build time.
 *
 * This has to be a single combined normalMap, not a normalMap plus a
 * separate bumpMap for the seams -- MeshStandardMaterial's shader only
 * ever applies ONE of normalMap/bumpMap (normalMap wins whenever both are
 * set; bumpMap is then silently ignored entirely, at any bumpScale), so
 * layering the plank grooves in as a bumpMap alongside the grain's own
 * normalMap rendered no differently than the grain alone -- the floor
 * looked completely flat regardless of how strong that bumpScale was
 * turned up, which is what "the floor looks flat" actually traced back to.
 */
const FLOOR_NORMAL_TEXTURE = "/textures/floors/floor-combined-normal.png";
const FLOOR_NORMAL_SCALE = 1.1;
/** World units one texture tile covers -- matches the old procedural
 * texture's repeat scale so existing room proportions still read right. */
const TILE_SIZE = 5;

export function Floor({ bounds, color }: { bounds: RoomBounds; color: string }) {
  const baseTexture = useTexture(FLOOR_TEXTURE_URL);
  const normalTexture = useTexture(FLOOR_NORMAL_TEXTURE);
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;

  // Each room needs its own repeat count (room-size-dependent), so every
  // room clones the shared cached textures rather than mutating them in
  // place. Both maps share the same repeat so the grain/planks and color
  // line up instead of drifting relative to each other.
  const { texture, normal } = useMemo(() => {
    const repeat = [width / TILE_SIZE, depth / TILE_SIZE] as const;

    const clone = baseTexture.clone();
    clone.needsUpdate = true;
    clone.wrapS = THREE.RepeatWrapping;
    clone.wrapT = THREE.RepeatWrapping;
    clone.colorSpace = THREE.SRGBColorSpace;
    clone.repeat.set(...repeat);

    const normalClone = normalTexture.clone();
    normalClone.needsUpdate = true;
    normalClone.wrapS = THREE.RepeatWrapping;
    normalClone.wrapT = THREE.RepeatWrapping;
    normalClone.repeat.set(...repeat);

    return { texture: clone, normal: normalClone };
  }, [baseTexture, normalTexture, width, depth]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0, centerZ]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial
        map={texture}
        normalMap={normal}
        normalScale={new THREE.Vector2(FLOOR_NORMAL_SCALE, FLOOR_NORMAL_SCALE)}
        color={color}
        roughness={0.85}
      />
    </mesh>
  );
}
