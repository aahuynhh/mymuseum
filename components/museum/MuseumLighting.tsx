"use client";

import type { GalleryRoom } from "@/types";
import { getGalleryTheme } from "@/game/museum/themes";

export function MuseumLighting({ rooms = [] }: { rooms?: GalleryRoom[] }) {
  return (
    <>
      <hemisphereLight args={["#fff6e4", "#d9c4a3", 1.05]} />
      <ambientLight intensity={0.6} />
      {/*
        Shadow tuning note: the dark, sometimes-flickering seam that used to
        run along every wall/floor junction was shadow acne, not a geometry
        bug -- a single directional light's shadow map spans the whole
        floor plan (~34x30 units) at what was only 1024x1024 texels (~32
        texels/unit), with a *negative* bias, which biases the depth
        comparison in the exact direction that causes a caster to
        self-shadow at a grazing/perpendicular angle. A wall meeting a
        floor at 90 degrees is the textbook case for this artifact. It was
        also worse than it needed to be because this Three.js build
        deprecates PCFSoftShadowMap and silently downgrades to hard
        PCFShadowMap (see the console warning), which has no filtering to
        blur over the acne the way the originally-intended soft shadows
        would have. Fix: a small *positive* bias plus shadow-normalBias
        (the standard, purpose-built fix for grazing-angle self-shadowing --
        it offsets the sample along the surface normal instead of along
        view depth), a slightly padded shadow-camera frustum so no wall
        sits exactly on its edge, and doubled shadow map resolution so any
        remaining error is sub-pixel instead of a visible band.
      */}
      <directionalLight
        position={[8, 11, 5]}
        intensity={1.4}
        color="#ffedcc"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-17}
        shadow-camera-right={17}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={0.00025}
        shadow-normalBias={0.045}
      />
      {/* One warm, theme-tinted accent light per gallery -- no shadow cost */}
      {rooms.map((room) => {
        const theme = getGalleryTheme(room.theme);
        const centerX = (room.bounds.minX + room.bounds.maxX) / 2;
        const centerZ = (room.bounds.minZ + room.bounds.maxZ) / 2;
        const span = Math.max(room.bounds.maxX - room.bounds.minX, room.bounds.maxZ - room.bounds.minZ);
        return (
          <pointLight
            key={room.id}
            position={[centerX, room.height * 0.72, centerZ]}
            intensity={0.85}
            color={theme.accentLight}
            distance={span * 1.1}
          />
        );
      })}
    </>
  );
}
