"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Billboard, Text } from "@react-three/drei";
import { avatarGeometry } from "@/game/avatar/geometry";
import type { AnimationState, AvatarConfiguration } from "@/types";
import {
  BOTTOM_OPTIONS,
  HAIR_COLOR_OPTIONS,
  SHOES_OPTIONS,
  SKIN_TONE_OPTIONS,
  TOP_OPTIONS,
} from "@/types/avatar";

function hexFor<T extends { value: string; hex: string }>(
  options: T[],
  value: string,
  fallback: string
) {
  return options.find((o) => o.value === value)?.hex ?? fallback;
}

interface AvatarModelProps {
  config: AvatarConfiguration;
  animationState?: AnimationState;
  username?: string;
  showLabel?: boolean;
  /** Enables idle/walk bob animation. Disable for static previews. */
  animate?: boolean;
}

/**
 * An original stylized avatar built entirely from primitive geometry: a
 * generously large rounded head, a short soft torso, rounded shoulder caps,
 * and simplified hands/feet, with modular hair/clothing/accessories driven
 * by AvatarConfiguration. No external models or third-party assets are used.
 */
export function AvatarModel({
  config,
  animationState = "idle",
  username,
  showLabel = false,
  animate = true,
}: AvatarModelProps) {
  const group = useRef<THREE.Group>(null);
  const bob = useRef(0);

  const skinHex = hexFor(SKIN_TONE_OPTIONS, config.skinTone, "#e8b98d");
  const hairHex = hexFor(HAIR_COLOR_OPTIONS, config.hairColor, "#7a4a2b");
  const topHex = hexFor(TOP_OPTIONS, config.top, "#e07a5f");
  const bottomHex = hexFor(BOTTOM_OPTIONS, config.bottom, "#3d5a6c");
  const shoeHex = hexFor(SHOES_OPTIONS, config.shoes, "#f2ede3");

  const materials = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.8 }),
      // DoubleSide because the open hair-cap geometries (partial sphere
      // shells) can show their hollow underside at some rotations/angles --
      // without this they'd flicker invisible via backface culling.
      hair: new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.7, side: THREE.DoubleSide }),
      top: new THREE.MeshStandardMaterial({ color: topHex, roughness: 0.85 }),
      bottom: new THREE.MeshStandardMaterial({ color: bottomHex, roughness: 0.85 }),
      shoe: new THREE.MeshStandardMaterial({ color: shoeHex, roughness: 0.65 }),
      eye: new THREE.MeshStandardMaterial({ color: "#33291f", roughness: 0.35 }),
      eyeHighlight: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.2,
        emissive: "#ffffff",
        emissiveIntensity: 0.15,
      }),
      cheek: new THREE.MeshStandardMaterial({
        color: "#ffa7ad",
        transparent: true,
        opacity: 0.4,
        roughness: 1,
      }),
      glasses: new THREE.MeshStandardMaterial({ color: "#3a332e", roughness: 0.3, metalness: 0.1 }),
      bag: new THREE.MeshStandardMaterial({ color: "#c98a5e", roughness: 0.85 }),
    }),
    [skinHex, hairHex, topHex, bottomHex, shoeHex]
  );

  useFrame((state, delta) => {
    if (!animate || !group.current) return;
    const speed = animationState === "walking" ? 9 : 2.4;
    const amplitude = animationState === "walking" ? 0.05 : 0.025;
    bob.current += delta * speed;
    group.current.position.y = Math.sin(bob.current) * amplitude;
    if (animationState === "walking") {
      group.current.rotation.z = Math.sin(bob.current * 1.4) * 0.02;
    } else {
      group.current.rotation.z = 0;
    }
  });

  return (
    <group>
      <group ref={group}>
        {/* Legs */}
        <mesh geometry={avatarGeometry.leg} material={materials.bottom} position={[-0.135, 0.2, 0]} />
        <mesh geometry={avatarGeometry.leg} material={materials.bottom} position={[0.135, 0.2, 0]} />
        {/* Shoes -- flattened and elongated so they read as shoes, not balls */}
        <mesh
          geometry={avatarGeometry.shoe}
          material={materials.shoe}
          position={[-0.135, 0.075, 0.055]}
          scale={[0.92, 0.58, 1.32]}
        />
        <mesh
          geometry={avatarGeometry.shoe}
          material={materials.shoe}
          position={[0.135, 0.075, 0.055]}
          scale={[0.92, 0.58, 1.32]}
        />
        {/* Hip / lower torso -- blends into the torso above for one soft silhouette */}
        <mesh geometry={avatarGeometry.hip} material={materials.bottom} position={[0, 0.35, 0]} />
        {/* Torso */}
        <mesh geometry={avatarGeometry.torso} material={materials.top} position={[0, 0.6, 0]} />
        {/* Waistband -- a deliberate seam where the shirt hem meets the pants,
            masking the ambiguous overlap between the torso and hip meshes. */}
        <mesh
          geometry={avatarGeometry.waistband}
          material={materials.top}
          position={[0, 0.45, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        {/* Collar -- a subtle ring at the neckline for a more dimensional, tailored feel */}
        <mesh
          geometry={avatarGeometry.collar}
          material={materials.top}
          position={[0, 0.94, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        {/* Shoulders -- round out the arm attachment so limbs don't read as sticks */}
        <mesh geometry={avatarGeometry.shoulder} material={materials.top} position={[-0.33, 0.62, 0]} />
        <mesh geometry={avatarGeometry.shoulder} material={materials.top} position={[0.33, 0.62, 0]} />
        {/* Arms -- a single smoothly tapered shape flows from shoulder to hand
            (wide at the top, matching the shoulder's own width, narrowing to
            the wrist) instead of stacked segments; the shoulder/hand spheres
            hide its open end caps. Kept short so the hand rests near the hip
            rather than reaching down the leg, for a cute, chibi-proportioned
            silhouette. */}
        <mesh geometry={avatarGeometry.arm} material={materials.top} position={[-0.3525, 0.53, 0.01]} rotation={[-0.08, 0, -0.25]} />
        <mesh geometry={avatarGeometry.hand} material={materials.skin} position={[-0.375, 0.44, 0.02]} />

        <mesh geometry={avatarGeometry.arm} material={materials.top} position={[0.3525, 0.53, 0.01]} rotation={[-0.08, 0, 0.25]} />
        <mesh geometry={avatarGeometry.hand} material={materials.skin} position={[0.375, 0.44, 0.02]} />
        {/* Crossbody bag accessory -- anchored to the torso/hip so it stays
            correctly placed regardless of arm pose, instead of hanging off a hand. */}
        {config.accessory === "tote-bag" && (
          <>
            <mesh
              geometry={avatarGeometry.bagStrap}
              material={materials.bag}
              position={[0.08, 0.62, 0.29]}
              rotation={[0.05, 0, 0.5]}
            />
            <mesh
              geometry={avatarGeometry.bagPouch}
              material={materials.bag}
              position={[0.26, 0.4, 0.24]}
              rotation={[0, 0.3, 0.15]}
            />
          </>
        )}
        {/* Head */}
        <group position={[0, 1.12, 0]}>
          <mesh geometry={avatarGeometry.head} material={materials.skin} />
          {/* Eyes */}
          <mesh geometry={avatarGeometry.eye} material={materials.eye} position={[-0.16, 0.02, 0.4]} />
          <mesh geometry={avatarGeometry.eye} material={materials.eye} position={[0.16, 0.02, 0.4]} />
          <mesh
            geometry={avatarGeometry.eyeHighlight}
            material={materials.eyeHighlight}
            position={[-0.185, 0.05, 0.435]}
          />
          <mesh
            geometry={avatarGeometry.eyeHighlight}
            material={materials.eyeHighlight}
            position={[0.135, 0.05, 0.435]}
          />
          {/* Cheeks -- small spheres rather than flat rotated discs, so they
              read correctly as a soft blush bump from every angle with no
              normal/rotation math that can point them into the head. */}
          <mesh geometry={avatarGeometry.cheek} material={materials.cheek} position={[-0.285, -0.085, 0.365]} />
          <mesh geometry={avatarGeometry.cheek} material={materials.cheek} position={[0.285, -0.085, 0.365]} />
          {/* Hair -- radii are tuned to sit just outside the head surface (a snug
              "cap" fit) rather than floating or clipping into the face. Pieces
              are translated/rotated but never non-uniformly scaled, since
              squashing a sphere shell pulls its rim back inside the head. */}
          {config.hairStyle === "curly-bob" && (
            <mesh geometry={avatarGeometry.hairCap} material={materials.hair} />
          )}
          {config.hairStyle === "twin-buns" && (
            <>
              <mesh geometry={avatarGeometry.hairCrown} material={materials.hair} />
              <mesh geometry={avatarGeometry.hairBun} material={materials.hair} position={[-0.38, 0.32, -0.14]} />
              <mesh geometry={avatarGeometry.hairBun} material={materials.hair} position={[0.38, 0.32, -0.14]} />
            </>
          )}
          {config.hairStyle === "swoop" && (
            <mesh
              geometry={avatarGeometry.hairSwoop}
              material={materials.hair}
              position={[0.015, 0.008, -0.008]}
              rotation={[0.25, 0, -0.18]}
            />
          )}
          {/* Accessories */}
          {/* Pushed out to z=0.485 -- far enough that the rings' distance
              from head-center (~0.51) exceeds every hair shell's radius
              (largest is hairSwoop at 0.495), so glasses always render in
              front of hair instead of being covered by a low-swept fringe. */}
          {config.accessory === "round-glasses" && (
            <group position={[0, 0.02, 0.485]}>
              <mesh geometry={avatarGeometry.glassesRing} material={materials.glasses} position={[-0.16, 0, 0]} />
              <mesh geometry={avatarGeometry.glassesRing} material={materials.glasses} position={[0.16, 0, 0]} />
              <mesh
                geometry={avatarGeometry.glassesBridge}
                material={materials.glasses}
                rotation={[0, 0, Math.PI / 2]}
              />
            </group>
          )}
          {config.accessory === "beret" && (
            <mesh
              geometry={avatarGeometry.beret}
              material={materials.top}
              position={[0.015, 0.008, -0.008]}
              rotation={[0.1, 0.05, 0.18]}
            />
          )}
        </group>
      </group>
      {showLabel && username && (
        // Billboard keeps the nameplate readable and camera-facing regardless
        // of which way the avatar itself is turned.
        <Billboard position={[0, 1.78, 0]}>
          <Text
            fontSize={0.16}
            color="#3c2e28"
            outlineWidth={0.012}
            outlineColor="#faf7f2"
            anchorX="center"
            anchorY="bottom"
          >
            {username}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
