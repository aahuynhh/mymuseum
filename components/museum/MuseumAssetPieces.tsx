"use client";

import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import * as THREE from "three";

const MODEL_URL = "/models/museum-asset/MuseumAsset.fbx";
/** The kit is modeled at roughly centimeter scale (a ~150-unit bench); this
 * scale brings it in line with the app's own world units (a ~1.1-unit
 * bench). */
const SCALE = 0.01;

/** Same stucco photo/normal map Walls.tsx and Furnishings.tsx's Sculpture
 * already use for cast plaster/stone surfaces -- the kit's own "Column"
 * piece ships with a flat, mapless gray material, which read as molded
 * plastic rather than the carved stone a classical museum column is meant
 * to look like. Reused rather than sourcing a dedicated stone photo, same
 * "one real surface, many uses" pattern the rest of the museum's materials
 * already follow. Only applied to "Column" -- the kit's other named pieces
 * (GlassBox, benches, barriers) keep their own materials. */
const STONE_TEXTURE = "/textures/walls/stucco-white.png";
const STONE_NORMAL_TEXTURE = "/textures/walls/stucco-normal.png";
/** World units one texture tile covers along the column's surface. */
const STONE_TILE_SIZE = 0.5;

/**
 * A single named piece (e.g. "Column", "RopeBarrierFull") lifted out of the
 * shared MuseumAsset.fbx kit (see public/models/museum-asset/CREDITS.md) --
 * one modular file exported with all pieces scattered at their own
 * authoring positions, not one assembled room. FBXLoader bakes each piece's
 * world position into its own transform hierarchy rather than leaving a
 * clean local origin, so recentering means measuring its own scaled
 * bounding box and cancelling that offset in a wrapping group, not just
 * zeroing `.position` (which is already identity and has no effect).
 */
export function MuseumAssetPiece({
  name,
  position,
  rotationY = 0,
  scale = 1,
}: {
  name: string;
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
}) {
  const fbx = useLoader(FBXLoader, MODEL_URL);
  const stoneTexture = useTexture(STONE_TEXTURE);
  const stoneNormalTexture = useTexture(STONE_NORMAL_TEXTURE);

  const { object, offset } = useMemo(() => {
    const source = fbx.getObjectByName(name);
    if (!source) throw new Error(`MuseumAsset.fbx has no piece named "${name}"`);
    const clone = source.clone(true);
    clone.scale.setScalar(SCALE);
    clone.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());

    // Built once per instance from the piece's own scaled bounding box, not
    // a fixed constant -- BoxGeometry-style fixed 0-1 UVs mean a shared
    // texture would otherwise tile at a different apparent scale on every
    // differently-sized piece pulled from this same kit.
    const stoneMaterial =
      name === "Column"
        ? (() => {
            const tex = stoneTexture.clone();
            tex.needsUpdate = true;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.repeat.set(Math.max(1, size.x / STONE_TILE_SIZE), Math.max(1, size.y / STONE_TILE_SIZE));

            const normalTex = stoneNormalTexture.clone();
            normalTex.needsUpdate = true;
            normalTex.wrapS = THREE.RepeatWrapping;
            normalTex.wrapT = THREE.RepeatWrapping;
            normalTex.repeat.copy(tex.repeat);

            return new THREE.MeshStandardMaterial({
              map: tex,
              normalMap: normalTex,
              // Lower than the walls' own 1.1 (see Walls.tsx) -- at that
              // strength the bump-driven shadow lines running through the
              // stucco grain read as dark streaks across the column rather
              // than subtle surface relief, especially stretched across a
              // tall, narrow shaft. A lighter touch here plus a paler tint
              // below reads closer to pale marble than heavy dark stone.
              normalScale: new THREE.Vector2(0.3, 0.3),
              color: "#e7e2d4",
              roughness: 0.65,
            });
          })()
        : null;

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (stoneMaterial) child.material = stoneMaterial;
      }
    });
    const center = box.getCenter(new THREE.Vector3());
    return { object: clone, offset: [-center.x, -box.min.y, -center.z] as [number, number, number] };
  }, [fbx, name, stoneTexture, stoneNormalTexture]);

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <group position={offset}>
        <primitive object={object} />
      </group>
    </group>
  );
}

export function preloadMuseumAssetKit() {
  useLoader.preload(FBXLoader, MODEL_URL);
}
