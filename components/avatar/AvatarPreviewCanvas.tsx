"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import type { AvatarConfiguration } from "@/types";
import { AvatarModel } from "./AvatarModel";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function AvatarPreviewCanvas({ config }: { config: AvatarConfiguration }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="aspect-square w-full overflow-hidden rounded-3xl border border-border/60 bg-canvas-deep shadow-warm-sm">
      <Canvas
        dpr={[1, 2]}
        shadows={false}
        // Framed for just the three current body shapes (rounded-cube, cone,
        // capsule) rather than the wider squat-to-tall range the old
        // eight-shape set spanned. The capsule (tallest -- see its
        // approxHeight) plus its tallest head decoration (top-hat) is the
        // binding constraint: pulled back/raised just far enough that its
        // crown and feet both stay inside the frame across a full
        // auto-rotate.
        camera={{ position: [0, 0.66, 2.54], fov: 34 }}
        className="cursor-grab active:cursor-grabbing"
      >
        <color attach="background" args={["#efe0cb"]} />
        {/* Broad, soft illumination -- a high ambient floor plus a gentle
            key/fill pair -- so the character reads with volume from a
            restrained diffuse gradient instead of a hard bright-to-dark
            falloff across curved shapes. Raising roughness/lowering
            envMapIntensity on the material (see game/avatar/materials.ts)
            only tames specular shine; this is what tames the underlying
            Lambertian shading gradient, which responds to light ratios, not
            material roughness. */}
        <ambientLight intensity={0.85} />
        <directionalLight position={[3, 4, 2]} intensity={0.6} color="#fff3df" />
        <directionalLight position={[-2.5, 1.5, 3]} intensity={0.3} color="#fff3df" />
        <Suspense fallback={null}>
          <Environment preset="apartment" environmentIntensity={0.12} />
          <group position={[0, -0.55, 0]}>
            <AvatarModel
              config={config}
              animationState="idle"
              animate={!prefersReducedMotion}
            />
          </group>
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 2.6}
          maxPolarAngle={Math.PI / 2.1}
          // Vertically centered between the capsule+top-hat's crown and its
          // feet -- pairs with the camera above so that tallest combination
          // fits fully in frame without pushing the shorter shapes' feet out
          // the bottom.
          target={[0, 0.21, 0]}
          autoRotate={!prefersReducedMotion}
          autoRotateSpeed={2.2}
          rotateSpeed={0.4}
        />
      </Canvas>
    </div>
  );
}
