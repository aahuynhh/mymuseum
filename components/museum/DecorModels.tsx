"use client";

import { useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";

const RUG_TEXTURE = "/textures/fabric/rug-weave.png";

/** tall_flower.mtl's own Kd values (leaf green, stem near-black, trunk dark
 * red-brown, orange highlight), read directly from the .mtl file and
 * hardcoded here by material name, rather than read back at runtime off the
 * THREE.Color the loader produced. Extracting a hex string from that loaded
 * Color at runtime (`"#" + color.getHexString()`) reproducibly rendered
 * solid white in the browser despite every logged value along the way
 * (baseHex, finalColor, and the resulting material's own color) reading
 * back correct -- a hardcoded literal in the exact same spot renders
 * correctly, so the model's own loaded Color object is the thing to avoid
 * touching at runtime, whatever the underlying cause turns out to be. */
const TALL_FLOWER_COLORS: Record<string, string> = {
  "Material.012": "#2f6615",
  "Material.017": "#0d0906",
  "Material.009": "#38130a",
  "Material.014": "#cc4a1a",
};

/**
 * Loads a CC0 .obj/.mtl decoration model (see public/models/decor/CREDITS.md)
 * and clones it per instance -- like CustomRoomModel.tsx, useLoader caches
 * and reuses one Object3D per url pair, and a single Object3D can't exist at
 * two positions in the scene graph at once (a room can place more than one
 * wall sconce).
 */
function useObjModel(objUrl: string, mtlUrl: string, tintColor?: string) {
  const materials = useLoader(MTLLoader, mtlUrl);
  const object = useLoader(OBJLoader, objUrl, (loader) => {
    materials.preload();
    loader.setMaterials(materials);
  });
  const model = useMemo(() => object.clone(true), [object]);

  useEffect(() => {
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      // Shadow casting doubles a mesh's render cost (a second pass through
      // the shadow camera) -- worth it for the room's own structural
      // geometry, not for secondary decor. tall_flower.obj alone is 16.6k
      // faces (vs. ~2-4k for the other decor models) and is placed twice
      // per room; casting shadows for all ten instances was a real,
      // measurable contributor to the museum running slow. receiveShadow
      // stays on since that's a cheap shader read, not an extra pass.
      child.castShadow = false;
      child.receiveShadow = true;

      // MTLLoader builds MeshPhongMaterial by default. Reading a hex string
      // back off the *loaded* material's own THREE.Color at runtime
      // (`"#" + color.getHexString()`) reproducibly rendered solid white in
      // the browser despite every logged value along the way reading back
      // correct -- swapping to an unlit MeshBasicMaterial with that same
      // runtime-read value didn't fix it either, only made the (still
      // wrong) color flat. A hardcoded literal in the exact same spot
      // renders correctly, so TALL_FLOWER_COLORS above sidesteps whatever
      // was wrong with touching that loaded Color object, and staying on
      // MeshStandardMaterial (lit, shaded) instead of MeshBasicMaterial
      // (flat, unlit) is what keeps the plant from reading as a flat neon
      // cutout against the room's naturally-shaded walls and floor.
      const fix = (m: THREE.Material) => {
        const knownHex = TALL_FLOWER_COLORS[m.name];
        const baseHex = knownHex ?? ("color" in m ? "#" + (m as THREE.MeshPhongMaterial).color.getHexString() : "#ffffff");
        return new THREE.MeshStandardMaterial({ color: tintColor ?? baseHex, roughness: 0.85, metalness: 0 });
      };
      // Materials clone per-mesh first since `object.clone(true)` shares
      // material instances across every clone of this cached model;
      // mutating one in place would affect every other room using the same
      // model.
      child.material = Array.isArray(child.material) ? child.material.map(fix) : fix(child.material);
    });
  }, [model, tintColor]);

  return model;
}

/** A tall potted plant (modeled ~1.84 units tall), used in place of the
 * primitive PottedPlant for a room's larger open floor areas. */
export function TallPlant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const model = useObjModel("/models/decor/tall_flower.obj", "/models/decor/tall_flower.mtl");
  return <primitive object={model} position={position} scale={scale} />;
}

/** A floor rug (modeled ~1.58 x 1.58), sized to sit beneath a room's
 * centerpiece (sculpture/benches). `color` re-tints the model -- its own
 * .mtl color is nearly black, which read as a dark smudge on the floor
 * rather than a rug -- and a woven-fabric texture (CC0, from the pack in
 * public/textures/fabric/CREDITS.md) is layered on as `map` on top of that
 * tint, in a second pass after useObjModel's own effect has already run, so
 * the rug reads as a patterned weave instead of a flat-colored disc. */
export function Rug({
  position,
  scale = 1,
  rotationY = 0,
  color = "#c97b5f",
}: {
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
  color?: string;
}) {
  const model = useObjModel("/models/decor/carpet.obj", "/models/decor/carpet.mtl", color);
  const rugTexture = useTexture(RUG_TEXTURE);

  useEffect(() => {
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const applyMap = (m: THREE.Material) => {
        if (!("map" in m)) return m;
        const tex = rugTexture.clone();
        tex.needsUpdate = true;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.repeat.set(2.4, 2.4);
        m.map = tex;
        m.needsUpdate = true;
        return m;
      };
      child.material = Array.isArray(child.material) ? child.material.map(applyMap) : applyMap(child.material);
    });
  }, [model, rugTexture]);

  return <primitive object={model} position={position} rotation={[0, rotationY, 0]} scale={scale} />;
}

export function preloadDecorModels() {
  useLoader.preload(OBJLoader, "/models/decor/tall_flower.obj");
  useLoader.preload(OBJLoader, "/models/decor/carpet.obj");
}
