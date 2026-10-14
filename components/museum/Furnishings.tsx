"use client";

import { useMemo } from "react";
import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";

/** Same stucco texture Walls.tsx uses for the room's own walls -- the
 * sculpture's pedestal and form both read as cast plaster/stone rather than
 * flat-colored primitives with it, and reusing the already-loaded texture
 * (drei's useTexture caches by url) costs nothing extra to load. */
const PLASTER_TEXTURE = "/textures/walls/stucco-white.png";
/** Same normal map Walls.tsx uses for its stucco relief -- the sculpture's
 * diffuse texture alone (color blotches only) read as flat even at a tight
 * tiling, the same way the walls did before they got a real normalMap; a
 * genuine normal map is what actually makes the grain read as cast plaster
 * up close, which is exactly the range a centerpiece sculpture gets viewed
 * at. */
const PLASTER_NORMAL_TEXTURE = "/textures/walls/stucco-normal.png";
/** Board-formed concrete -- real museum benches are as often cast concrete
 * as wood, and it reads calmer/more "gallery" than a wood grain here. */
const CONCRETE_TEXTURE = "/textures/concrete/bench-concrete.png";

export function Bench({ position }: { position: [number, number, number] }) {
  const concreteTexture = useTexture(CONCRETE_TEXTURE);
  const material = useMemo(() => {
    const tex = concreteTexture.clone();
    tex.needsUpdate = true;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.repeat.set(1.3, 0.6);
    return new THREE.MeshStandardMaterial({ map: tex, color: "#a89e91", roughness: 0.85 });
  }, [concreteTexture]);

  return (
    <RoundedBox
      args={[1.1, 0.42, 0.42]}
      radius={0.09}
      smoothness={4}
      position={position}
      material={material}
      castShadow
      receiveShadow
    />
  );
}

/** A hanging pendant fixture -- a thin rod up to the ceiling, a ring, and a
 * cluster of small glowing bulbs -- giving MuseumLighting's existing
 * per-room accent point light a visible source to hang from instead of
 * glowing from thin air. Also carries its own small point light at the bulb
 * cluster so the fixture visibly contributes light of its own, on top of
 * (not instead of) that room-wide accent light. */
export function Chandelier({
  position,
  accentColor,
}: {
  position: [number, number, number];
  accentColor: string;
}) {
  const rodMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3a352f", roughness: 0.4, metalness: 0.6 }),
    []
  );
  const ringMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#8a6f47", roughness: 0.35, metalness: 0.7 }),
    []
  );
  const bulbMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.3,
        emissive: accentColor,
        emissiveIntensity: 0.7,
      }),
    [accentColor]
  );

  const bulbCount = 6;
  const bulbs = useMemo(
    () =>
      Array.from({ length: bulbCount }, (_, i) => {
        const angle = (i / bulbCount) * Math.PI * 2;
        return [Math.cos(angle) * 0.32, -0.05, Math.sin(angle) * 0.32] as [number, number, number];
      }),
    []
  );

  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]} material={rodMaterial}>
        <cylinderGeometry args={[0.012, 0.012, 0.5, 6]} />
      </mesh>
      <mesh material={ringMaterial} castShadow>
        <torusGeometry args={[0.32, 0.02, 8, 20]} />
      </mesh>
      {bulbs.map((bulbPosition, i) => (
        <mesh key={i} position={bulbPosition} material={bulbMaterial}>
          <sphereGeometry args={[0.045, 10, 8]} />
        </mesh>
      ))}
      <pointLight position={[0, -0.05, 0]} intensity={0.5} distance={5} decay={2} color={accentColor} />
    </group>
  );
}

/** An original abstract sculpture -- stacked, gently rotated forms, not a
 * representational figure -- for a museum centerpiece that reads as "art"
 * without depicting anything specific. */
export function Sculpture({ position }: { position: [number, number, number] }) {
  const plasterTexture = useTexture(PLASTER_TEXTURE);
  const plasterNormalTexture = useTexture(PLASTER_NORMAL_TEXTURE);

  const pedestalMaterial = useMemo(() => {
    const tex = plasterTexture.clone();
    tex.needsUpdate = true;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.repeat.set(2.2, 1.7);

    const normalTex = plasterNormalTexture.clone();
    normalTex.needsUpdate = true;
    normalTex.wrapS = THREE.RepeatWrapping;
    normalTex.wrapT = THREE.RepeatWrapping;
    normalTex.repeat.copy(tex.repeat);

    return new THREE.MeshStandardMaterial({
      map: tex,
      normalMap: normalTex,
      normalScale: new THREE.Vector2(1.4, 1.4),
      color: "#fdebd1",
      roughness: 0.5,
    });
  }, [plasterTexture, plasterNormalTexture]);
  const formMaterial = useMemo(() => {
    const tex = plasterTexture.clone();
    tex.needsUpdate = true;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.repeat.set(3, 1.5);

    const normalTex = plasterNormalTexture.clone();
    normalTex.needsUpdate = true;
    normalTex.wrapS = THREE.RepeatWrapping;
    normalTex.wrapT = THREE.RepeatWrapping;
    normalTex.repeat.copy(tex.repeat);

    return new THREE.MeshStandardMaterial({
      map: tex,
      normalMap: normalTex,
      normalScale: new THREE.Vector2(1.4, 1.4),
      color: "#c9b896",
      roughness: 0.35,
      metalness: 0.15,
    });
  }, [plasterTexture, plasterNormalTexture]);

  return (
    <group position={position}>
      <RoundedBox args={[0.7, 0.55, 0.7]} radius={0.04} position={[0, 0.275, 0]} material={pedestalMaterial} castShadow receiveShadow />
      <mesh position={[0, 0.75, 0]} rotation={[0.2, 0.4, 0]} material={formMaterial} castShadow>
        <torusKnotGeometry args={[0.22, 0.07, 64, 12, 2, 3]} />
      </mesh>
    </group>
  );
}
