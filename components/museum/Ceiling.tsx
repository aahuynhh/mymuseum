"use client";

import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { RoomBounds } from "@/types";

const CEILING_COLOR = "#ede4d3";
/** Same stucco texture the walls use -- the ceiling cap and lantern curb
 * are both painted plaster in real gallery architecture too. */
const CEILING_TEXTURE = "/textures/walls/stucco-white.png";
const CEILING_TILE_SIZE = 2.4;

/**
 * A flat plaster ceiling cap with a raised, glazed skylight "lantern" in the
 * center -- a real three-dimensional box with its own visible side walls,
 * not a glowing decal flush with the ceiling (the previous single
 * semi-transparent plane), so it actually reads as an overhead structure
 * with depth from below, closer to a real gallery's clerestory skylight.
 */
export function Ceiling({
  bounds,
  height,
  skylightColor,
}: {
  bounds: RoomBounds;
  height: number;
  skylightColor: string;
}) {
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;

  const ceilingTexture = useTexture(CEILING_TEXTURE);

  const capMaterial = useMemo(() => {
    const tex = ceilingTexture.clone();
    tex.needsUpdate = true;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.repeat.set(width / CEILING_TILE_SIZE, depth / CEILING_TILE_SIZE);
    return new THREE.MeshStandardMaterial({
      map: tex,
      color: CEILING_COLOR,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
  }, [ceilingTexture, width, depth]);
  const curbMaterial = useMemo(() => {
    const tex = ceilingTexture.clone();
    tex.needsUpdate = true;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.repeat.set(1.5, 1);
    return new THREE.MeshStandardMaterial({ map: tex, color: CEILING_COLOR, roughness: 0.7 });
  }, [ceilingTexture]);
  const glassMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: skylightColor,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      }),
    [skylightColor]
  );

  const wellHeight = height * 0.22;
  const wellWidth = Math.min(width * 0.5, depth * 1.4);
  const wellDepth = Math.min(depth * 0.5, width * 0.5);
  const curbThickness = 0.08;

  return (
    <group>
      {/* Flat ceiling cap -- closes the room above the walls everywhere the
          raised well doesn't cover. */}
      <mesh position={[centerX, height, centerZ]} rotation={[Math.PI / 2, 0, 0]} material={capMaterial} receiveShadow>
        <planeGeometry args={[width, depth]} />
      </mesh>

      {/* Raised lantern well -- four short curb walls rising from the
          ceiling line, capped with tinted glass. No castShadow: these sit
          right at the ceiling, well above the directional light's usual
          shadow-relevant range, and four rooms' worth (20 objects total)
          casting shadows was pure shadow-map cost for an effect nobody
          would see. */}
      <group position={[centerX, height, centerZ]}>
        <mesh position={[0, wellHeight / 2, wellDepth / 2]} material={curbMaterial}>
          <boxGeometry args={[wellWidth, wellHeight, curbThickness]} />
        </mesh>
        <mesh position={[0, wellHeight / 2, -wellDepth / 2]} material={curbMaterial}>
          <boxGeometry args={[wellWidth, wellHeight, curbThickness]} />
        </mesh>
        <mesh position={[wellWidth / 2, wellHeight / 2, 0]} material={curbMaterial}>
          <boxGeometry args={[curbThickness, wellHeight, wellDepth]} />
        </mesh>
        <mesh position={[-wellWidth / 2, wellHeight / 2, 0]} material={curbMaterial}>
          <boxGeometry args={[curbThickness, wellHeight, wellDepth]} />
        </mesh>
        <mesh position={[0, wellHeight, 0]} rotation={[Math.PI / 2, 0, 0]} material={glassMaterial}>
          <planeGeometry args={[wellWidth, wellDepth]} />
        </mesh>
      </group>
    </group>
  );
}
