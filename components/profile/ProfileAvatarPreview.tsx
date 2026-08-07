"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import type { AvatarConfiguration } from "@/types";
import { AvatarModel } from "@/components/avatar/AvatarModel";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function ProfileAvatarPreview({ config }: { config: AvatarConfiguration }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="aspect-square w-28 shrink-0 overflow-hidden rounded-3xl border border-border/60 bg-canvas-deep shadow-warm-sm sm:w-36">
      {/* Headshot framing: the camera sits level with the head (which lands
          at world y=0.07 once the -1.05 group offset is applied) and close
          enough that hair/face/upper shoulders fill the frame, instead of
          the full-body framing used by the avatar editor's preview. */}
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.07, 2.15], fov: 30 }}>
        <color attach="background" args={["#efe0cb"]} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 3, 2]} intensity={0.8} color="#fff3df" />
        <Suspense fallback={null}>
          <group position={[0, -1.05, 0]}>
            <AvatarModel config={config} animationState="idle" animate={!prefersReducedMotion} />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}
