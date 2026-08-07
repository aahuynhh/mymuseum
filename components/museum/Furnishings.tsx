"use client";

import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

export function Bench({ position }: { position: [number, number, number] }) {
  return (
    <RoundedBox args={[1.1, 0.42, 0.42]} radius={0.09} smoothness={4} position={position} castShadow receiveShadow>
      <meshStandardMaterial color="#bf9d78" roughness={0.75} />
    </RoundedBox>
  );
}

export function PottedPlant({ position }: { position: [number, number, number] }) {
  const foliageMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#80965f", roughness: 0.85 }),
    []
  );
  const potMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#cd665d", roughness: 0.8 }),
    []
  );

  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]} material={potMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.17, 0.44, 16]} />
      </mesh>
      <mesh position={[0, 0.62, 0]} material={foliageMaterial} castShadow>
        <sphereGeometry args={[0.32, 12, 10]} />
      </mesh>
      <mesh position={[0.18, 0.78, 0.1]} material={foliageMaterial} castShadow>
        <sphereGeometry args={[0.2, 10, 8]} />
      </mesh>
      <mesh position={[-0.16, 0.82, -0.12]} material={foliageMaterial} castShadow>
        <sphereGeometry args={[0.22, 10, 8]} />
      </mesh>
    </group>
  );
}

/** An original abstract sculpture -- stacked, gently rotated forms, not a
 * representational figure -- for a museum centerpiece that reads as "art"
 * without depicting anything specific. */
export function Sculpture({ position }: { position: [number, number, number] }) {
  const pedestalMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#fdebd1", roughness: 0.5 }),
    []
  );
  const formMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#c9b896", roughness: 0.35, metalness: 0.15 }),
    []
  );

  return (
    <group position={position}>
      <RoundedBox args={[0.7, 0.55, 0.7]} radius={0.04} position={[0, 0.275, 0]} material={pedestalMaterial} castShadow receiveShadow />
      <mesh position={[0, 0.75, 0]} rotation={[0.2, 0.4, 0]} material={formMaterial} castShadow>
        <torusKnotGeometry args={[0.22, 0.07, 64, 12, 2, 3]} />
      </mesh>
    </group>
  );
}
