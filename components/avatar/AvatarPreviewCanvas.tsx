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
        camera={{ position: [0, 1.12, 3.5], fov: 34 }}
        className="cursor-grab active:cursor-grabbing"
      >
        <color attach="background" args={["#efe0cb"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 2]} intensity={0.9} color="#fff3df" />
        <Suspense fallback={null}>
          <Environment preset="apartment" environmentIntensity={0.25} />
          <group position={[0, -1, 0]}>
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
          target={[0, 0.1, 0]}
          autoRotate={!prefersReducedMotion}
          autoRotateSpeed={2.2}
        />
      </Canvas>
    </div>
  );
}
