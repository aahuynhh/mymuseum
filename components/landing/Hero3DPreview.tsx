"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { MuseumRoom } from "@/components/museum/MuseumRoom";
import { MuseumLighting } from "@/components/museum/MuseumLighting";
import { AvatarModel } from "@/components/avatar/AvatarModel";
import { DEMO_MUSEUM } from "@/data/museum";
import { DEMO_ARTIST_AVATAR } from "@/data/demoArtist";
import type { AvatarConfiguration } from "@/types";

const VISITOR_CONFIG: AvatarConfiguration = {
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

/**
 * Walks a small back-and-forth loop instead of standing in one idle pose --
 * the single biggest reason the preview read as a static screenshot rather
 * than a live room. Path is a short, gentle stroll (not a patrol route),
 * matching a visitor pausing to browse rather than pacing.
 */
function WanderingVisitor({
  config,
  center,
  amplitude,
  speed,
  phase = 0,
  animate,
}: {
  config: AvatarConfiguration;
  center: [number, number];
  amplitude: number;
  speed: number;
  phase?: number;
  animate: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const t = useRef(phase);

  useFrame((_state, delta) => {
    if (!animate || !group.current) return;
    t.current += delta * speed;
    const x = center[0] + Math.sin(t.current) * amplitude;
    const z = center[1] + Math.cos(t.current * 0.6) * (amplitude * 0.4);
    const prevX = group.current.position.x;
    const prevZ = group.current.position.z;
    group.current.position.set(x, 0, z);
    const dx = x - prevX;
    const dz = z - prevZ;
    if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
      group.current.rotation.y = Math.atan2(dx, dz);
    }
  });

  return (
    <group ref={group} position={[center[0], 0, center[1]]}>
      <AvatarModel config={config} animationState="walking" animate />
    </group>
  );
}

/** Slow, subtle intensity drift so the room reads as lit rather than static-rendered. */
function LivingGlow({
  position,
  color,
  animate,
  phase = 0,
}: {
  position: [number, number, number];
  color: string;
  animate: boolean;
  phase?: number;
}) {
  const light = useRef<THREE.PointLight>(null);
  const t = useRef(phase);

  useFrame((_state, delta) => {
    if (!animate || !light.current) return;
    t.current += delta * 0.35;
    light.current.intensity = 0.55 + Math.sin(t.current) * 0.12;
  });

  return <pointLight ref={light} position={position} color={color} intensity={0.55} distance={6} />;
}

/** A very slow FOV pulse -- reads as the camera gently "breathing" rather
 * than a locked-off render, without fighting OrbitControls' own management
 * of camera position/orbit (which a position-based effect would). */
function CameraBreath({ animate }: { animate: boolean }) {
  const t = useRef(0);
  const baseFov = useRef<number | null>(null);

  useFrame((state, delta) => {
    const camera = state.camera;
    if (!("fov" in camera)) return;
    if (baseFov.current === null) baseFov.current = camera.fov;
    if (!animate) return;
    t.current += delta * 0.18;
    camera.fov = baseFov.current + Math.sin(t.current) * 0.7;
    camera.updateProjectionMatrix();
  });

  return null;
}

/**
 * Three.js's OrbitControls.autoRotate only ever spins one direction --
 * combined with min/maxAzimuthAngle it just drifts into the limit and sits
 * there for good once reached, rather than looping. Flipping the sign of
 * autoRotateSpeed a hair before each limit turns that dead stop into a
 * continuous back-and-forth sweep, so the preview never goes still.
 *
 * The bounds themselves (see ORBIT_MIN/MAX_AZIMUTH) aren't arbitrary: a
 * true unrestricted 360 reveals an unlit doorway into a room this preview
 * doesn't otherwise light, which renders as a jarring black wedge filling
 * much of the frame. Measured empirically, that dead zone runs from about
 * -2.0 to +2.7 rad through the wraparound point -- so the safe range below
 * is the widest continuous arc that avoids it, roughly 250 degrees, as
 * close to "a full circle" as the scene can currently support cleanly.
 */
function AutoOrbitBounce({
  controlsRef,
  min,
  max,
  baseSpeed,
  animate,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  min: number;
  max: number;
  baseSpeed: number;
  animate: boolean;
}) {
  const direction = useRef(1);
  const margin = 0.03;

  useFrame(() => {
    if (!animate) return;
    const controls = controlsRef.current;
    if (!controls) return;

    const angle = controls.getAzimuthalAngle();
    if (angle >= max - margin) direction.current = -1;
    else if (angle <= min + margin) direction.current = 1;

    controls.autoRotateSpeed = baseSpeed * direction.current;
  });

  return null;
}

const ORBIT_MIN_AZIMUTH = -1.9;
const ORBIT_MAX_AZIMUTH = 2.5;

/**
 * Placed as a Suspense sibling alongside the museum's own textures/models
 * inside the `<Suspense fallback={null}>` below -- React only mounts it
 * once every other suspended child in that same boundary has actually
 * resolved, so its mount is the one reliable signal that the room is ready
 * to look at. Nothing to render (`fallback={null}` already handles the
 * scene itself going invisible while loading); it only exists to fire
 * `onReady` back out to the page-level loading gate (see HomeLoadingGate),
 * which is what actually covers the screen while this is still loading --
 * this component has no loading UI of its own.
 */
function LoadedSignal({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

/**
 * The living "window" into the museum used by the landing hero. Framing
 * (the arched border, shadow, caption bar) lives in Hero.tsx so this
 * component can be dropped into any shaped container -- it only renders
 * the scene itself, filling its parent completely.
 *
 * `onReady` fires once every texture/model inside is actually loaded (see
 * LoadedSignal) -- HomeLoadingGate is what covers the whole page (not just
 * this component) with a loading screen until that fires or its own
 * failsafe timer elapses, whichever comes first, so the header/nav chrome
 * around this preview never appears before the preview itself can.
 */
export function Hero3DPreview({ onReady }: { onReady: () => void }) {
  // Always animated, regardless of the visitor's OS-level reduced-motion
  // preference -- this is the marketing hero's core "living demo" pitch, so
  // it should keep moving the moment the page opens rather than sitting
  // frozen for anyone with that setting on.
  const animate = true;
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        shadows
        camera={{ position: [5.4, 2.7, 1.6], fov: 42 }}
        className="cursor-grab active:cursor-grabbing"
      >
        <color attach="background" args={["#2f4258"]} />
        <CameraBreath animate={animate} />
        <AutoOrbitBounce
          controlsRef={controlsRef}
          min={ORBIT_MIN_AZIMUTH}
          max={ORBIT_MAX_AZIMUTH}
          baseSpeed={0.6}
          animate={animate}
        />
        <MuseumLighting rooms={DEMO_MUSEUM.rooms} />
        <LivingGlow position={[-2.2, 1.8, -1.1]} color="#ffdfa8" animate={animate} phase={0} />
        <LivingGlow position={[1.6, 1.8, -2.7]} color="#ffe4b0" animate={animate} phase={3.4} />
        <Suspense fallback={null}>
          <LoadedSignal onReady={onReady} />
          <MuseumRoom museum={DEMO_MUSEUM} />
          <group position={[-2.2, 0, -1.1]} rotation={[0, 0.6, 0]}>
            <AvatarModel config={DEMO_ARTIST_AVATAR} animationState="idle" animate={animate} />
          </group>
          <WanderingVisitor
            config={VISITOR_CONFIG}
            center={[1.6, -2.7]}
            amplitude={0.85}
            speed={0.45}
            animate={animate}
          />
          <WanderingVisitor
            config={THIRD_CONFIG}
            center={[-0.4, 0.6]}
            amplitude={0.55}
            speed={0.3}
            phase={2.1}
            animate={animate}
          />
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 2.4}
          minAzimuthAngle={ORBIT_MIN_AZIMUTH}
          maxAzimuthAngle={ORBIT_MAX_AZIMUTH}
          target={[-0.4, 1.3, -2.2]}
          autoRotate={animate}
          autoRotateSpeed={0.6}
        />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-end bg-gradient-to-t from-ink/75 via-ink/20 to-transparent px-6 py-5 text-surface">
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage opacity-75 motion-reduce:hidden" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sage" />
          </span>
          3 visitors here now
        </span>
      </div>
    </div>
  );
}
