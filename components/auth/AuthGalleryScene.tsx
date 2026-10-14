"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { MuseumRoom } from "@/components/museum/MuseumRoom";
import { MuseumLighting } from "@/components/museum/MuseumLighting";
import { AvatarModel } from "@/components/avatar/AvatarModel";
import { DEMO_MUSEUM } from "@/data/museum";
import { DEMO_ARTIST_AVATAR } from "@/data/demoArtist";
import type { AvatarConfiguration } from "@/types";

const GUEST_CONFIG: AvatarConfiguration = {
  bodyShape: "capsule",
  skinTone: "sky",
  hairStyle: "sprout",
  hairColor: "berry",
  top: "overall-set",
  bottom: "canvas-shorts",
  shoes: "garden-boots",
  accessory: "none",
  expression: "excited",
};

const THIRD_CONFIG: AvatarConfiguration = {
  bodyShape: "cone",
  skinTone: "sage",
  hairStyle: "spiky-hair",
  hairColor: "flax",
  top: "linen-shirt",
  bottom: "denim-skirt",
  shoes: "canvas-sneakers",
  accessory: "square-glasses",
  expression: "standard",
};

/** Aims the camera once on mount, since skipping OrbitControls here (see
 * AuthGalleryScene's comment) means nothing else ever sets its rotation. A
 * single lookAt call, not a per-frame one -- there's nothing to keep
 * re-aiming at. */
function StaticGaze({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(...target);
  }, [camera, target]);
  return null;
}

/**
 * A quiet, non-interactive window into the real MyMuseum world for the
 * auth pages -- the same room/lighting/avatar building blocks as the
 * homepage hero (Hero3DPreview) and the museum experience itself, reused
 * safely rather than reinvented. Unlike Hero3DPreview this has no
 * OrbitControls and no per-frame camera/light animation (no auto-orbit, no
 * wandering, no breathing FOV), so it stays cheap enough to sit in a side
 * panel next to a form rather than needing the whole screen. Avatars keep
 * only their own built-in idle motion.
 */
export function AuthGalleryScene() {
  return (
    <Canvas dpr={[1, 1.5]} shadows camera={{ position: [5.4, 2.7, 1.6], fov: 42 }}>
      <color attach="background" args={["#2f4258"]} />
      <StaticGaze target={[-0.4, 1.3, -2.2]} />
      <MuseumLighting rooms={DEMO_MUSEUM.rooms} />
      <Suspense fallback={null}>
        <MuseumRoom museum={DEMO_MUSEUM} />
        <group position={[-2.2, 0, -1.1]} rotation={[0, 0.6, 0]}>
          <AvatarModel config={DEMO_ARTIST_AVATAR} animationState="idle" animate />
        </group>
        <group position={[1.6, 0, -2.7]} rotation={[0, -0.4, 0]}>
          <AvatarModel config={GUEST_CONFIG} animationState="idle" animate />
        </group>
        {/* Kept clear of the main gallery's centerpiece Sculpture (rendered
            at the largest room's center, [0, 0, -1.25] -- see
            MuseumRoom.tsx), which otherwise sits right where this avatar
            would and hides it. */}
        <group position={[-1.0, 0, -3.2]} rotation={[0, 1.2, 0]}>
          <AvatarModel config={THIRD_CONFIG} animationState="idle" animate />
        </group>
      </Suspense>
    </Canvas>
  );
}
