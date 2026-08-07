"use client";

import { useMemo } from "react";
import { Text, useTexture } from "@react-three/drei";
import type { Artwork } from "@/types";

const DEFAULT_WIDTH = 1.7;
const DEFAULT_HEIGHT = 1.3;
const FRAME_DEPTH = 0.07;

interface ArtworkFrameProps {
  artwork: Artwork;
  isActive?: boolean;
}

export function ArtworkFrame({ artwork, isActive = false }: ArtworkFrameProps) {
  const texture = useTexture(artwork.imageUrl);

  const frameWidth = artwork.frameWidth ?? DEFAULT_WIDTH;
  const frameHeight = artwork.frameHeight ?? DEFAULT_HEIGHT;
  const matWidth = frameWidth - 0.1;
  const matHeight = frameHeight - 0.1;
  const openingWidth = matWidth - 0.16;
  const openingHeight = matHeight - 0.16;

  // "Contain-fit" the image inside the mat opening: scale it down to the
  // largest size that fits without exceeding either dimension, preserving
  // the source aspect ratio exactly. The uploaded image itself is never
  // cropped or stretched -- only its displayed size in the scene changes.
  const [imageWidth, imageHeight] = useMemo(() => {
    const aspect = artwork.imageAspectRatio ?? openingWidth / openingHeight;
    const openingAspect = openingWidth / openingHeight;
    return aspect > openingAspect
      ? [openingWidth, openingWidth / aspect]
      : [openingHeight * aspect, openingHeight];
  }, [artwork.imageAspectRatio, openingWidth, openingHeight]);

  // Scales with the frame instead of using a floor wider than most frames --
  // the old 1.05 minimum was larger than the small-tier frames introduced
  // for size variety, so the plaque visually outweighed the painting itself.
  const plaqueWidth = Math.max(0.8, Math.min(1.7, frameWidth * 0.62));
  const plaqueHeight = 0.22;

  const normal = useMemo(() => {
    const theta = artwork.wallPosition.rotationY;
    return { x: Math.sin(theta), z: Math.cos(theta) };
  }, [artwork.wallPosition.rotationY]);

  // Walls.tsx keeps each room's wall entirely on its own side of the
  // room-bounds line (outer face flush with the boundary, inner face a
  // full THICKNESS -- 0.2 -- further in), not straddling it as before, so
  // the frame needs to clear that full 0.2 to sit just proud of the wall
  // instead of embedding into it.
  const standoff = 0.23;
  const position: [number, number, number] = [
    artwork.wallPosition.x + normal.x * standoff,
    artwork.wallPosition.y,
    artwork.wallPosition.z + normal.z * standoff,
  ];

  return (
    <group position={position} rotation={[0, artwork.wallPosition.rotationY, 0]}>
      {/* Outer frame -- a warm walnut wood tone, glowing terracotta while its artwork is open/focused */}
      <mesh castShadow>
        <boxGeometry args={[frameWidth, frameHeight, FRAME_DEPTH]} />
        <meshStandardMaterial
          color={isActive ? "#b86c4c" : "#4a3527"}
          roughness={0.45}
          metalness={0.06}
        />
      </mesh>
      {/* Mat board -- a cream inset between the frame and the piece, like real gallery matting */}
      <mesh position={[0, 0, FRAME_DEPTH / 2 + 0.003]}>
        <planeGeometry args={[matWidth, matHeight]} />
        <meshStandardMaterial color="#faf7f2" roughness={0.95} />
      </mesh>
      {/* The artwork itself */}
      <mesh position={[0, 0, FRAME_DEPTH / 2 + 0.006]}>
        <planeGeometry args={[imageWidth, imageHeight]} />
        <meshStandardMaterial map={texture} roughness={0.9} toneMapped={false} />
      </mesh>
      {/* Label plaque -- a solid cream card (with a thin dark edge) behind
          the title/artist text, so it reads clearly against every gallery
          wall color instead of relying on the wall's own tone for contrast. */}
      <group position={[0, -frameHeight / 2 - 0.14, 0.02]}>
        <mesh position={[0, -0.09, -0.006]}>
          <planeGeometry args={[plaqueWidth + 0.035, plaqueHeight + 0.035]} />
          <meshStandardMaterial color="#2c211c" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.09, -0.003]}>
          <planeGeometry args={[plaqueWidth, plaqueHeight]} />
          <meshStandardMaterial color="#faf7f2" roughness={0.85} />
        </mesh>
        <Text
          fontSize={0.062}
          color="#3c2e28"
          anchorX="center"
          anchorY="top"
          maxWidth={plaqueWidth - 0.08}
          textAlign="center"
        >
          {artwork.title}
        </Text>
        <Text
          position={[0, -0.085, 0]}
          fontSize={0.046}
          // Darker than the site's usual ink-muted (#786a60, only ~4.9:1 on
          // this cream backing) -- on a lit 3D plaque that ratio reads as
          // washed out, so this trades a little hierarchy contrast against
          // the title for much stronger legibility (~7.6:1).
          color="#5a4d44"
          anchorX="center"
          anchorY="top"
          maxWidth={plaqueWidth - 0.08}
          textAlign="center"
        >
          {`${artwork.artist}, ${artwork.year}`}
        </Text>
      </group>
    </group>
  );
}
