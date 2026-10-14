"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import type { AvatarConfiguration } from "@/types";
import { AvatarModel } from "./AvatarModel";
import { bodyShapes } from "@/game/avatar/shapes";
import { cn } from "@/utils/cn";

/**
 * Static, non-interactive headshot render for public display (the
 * /artist/[username] page) -- unlike AvatarPreviewCanvas (the editor's
 * full-body, drag-to-rotate preview), this never animates and has no
 * OrbitControls, and is only ever mounted once per page: rendering many of
 * these at once (e.g. in the /explore/artists grid) would open one WebGL
 * context per card, which browsers cap well below a typical listing's size.
 */
export function AvatarHeadshot({ config, className }: { config: AvatarConfiguration; className?: string }) {
  const shape = bodyShapes[config.bodyShape] ?? bodyShapes["rounded-cube"];
  // Each shape's `face` anchor is defined in its own local space and then
  // raised by that shape's `groundOffset` to stand on the floor -- adding
  // the two together is what the world actually sees, and it's what varies
  // (0.5-0.9) across the 8 shapes/heights, so it has to be read per-shape
  // rather than assumed.
  const faceWorldY = shape.groundOffset + shape.anchors.face.position[1];

  return (
    <div
      className={cn(
        "aspect-square shrink-0 overflow-hidden rounded-full border border-border/60 bg-canvas-deep shadow-warm-sm",
        className
      )}
    >
      {/* Headshot framing: recenter on the shape's own `face` anchor (rather
          than a fixed offset tuned for one shape) and zoom the camera in
          tight around it, so the badge crops to the face -- eyes, mouth, a
          hint of hair/decoration -- instead of shrinking the whole
          full-body character (legs, arms, torso) into a tiny circle. */}
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 2.35], fov: 18 }}>
        <color attach="background" args={["#efe0cb"]} />
        {/* Same broad key+fill+high-ambient approach as AvatarPreviewCanvas
            (see its comment) -- keeps the tight face crop from showing a
            hard light-to-dark gradient across the cheeks/forehead. */}
        <ambientLight intensity={0.95} />
        <directionalLight position={[2, 3, 2]} intensity={0.55} color="#fff3df" />
        <directionalLight position={[-1.5, 1, 2]} intensity={0.25} color="#fff3df" />
        <Suspense fallback={null}>
          <group position={[0, -faceWorldY, 0]}>
            <AvatarModel config={config} animationState="idle" animate={false} />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}
