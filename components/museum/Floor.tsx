"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { RoomBounds } from "@/types";

/** Procedurally paints a warm herringbone parquet floor texture on the client. */
function useFloorTexture(baseColor: string) {
  return useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    // Herringbone parquet: alternating diagonal plank blocks.
    const plank = 46;
    const board = 13;
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(Math.PI / 4);
    const span = size * 1.6;
    let row = 0;
    for (let y = -span; y < span; y += board) {
      let col = 0;
      for (let x = -span; x < span; x += plank) {
        const shade = (row + col) % 2 === 0 ? 1 : -1;
        const flicker = ((row * 31 + col * 17) % 9) - 4;
        ctx.fillStyle = `rgba(60, 38, 22, ${0.05 + shade * 0.02 + flicker * 0.004})`;
        ctx.fillRect(x, y, plank - 1.5, board - 1.5);
        ctx.strokeStyle = "rgba(45, 28, 16, 0.22)";
        ctx.lineWidth = 0.6;
        ctx.strokeRect(x, y, plank - 1.5, board - 1.5);
        col++;
      }
      row++;
    }
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [baseColor]);
}

export function Floor({ bounds, color }: { bounds: RoomBounds; color: string }) {
  const texture = useFloorTexture(color);
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;

  const repeated = useMemo(() => {
    if (!texture) return texture;
    const clone = texture.clone();
    clone.needsUpdate = true;
    clone.repeat.set(width / 5, depth / 5);
    return clone;
  }, [texture, width, depth]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0, centerZ]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      {repeated ? (
        <meshStandardMaterial map={repeated} roughness={0.6} />
      ) : (
        <meshStandardMaterial color={color} roughness={0.6} />
      )}
    </mesh>
  );
}
