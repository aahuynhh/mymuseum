import * as THREE from "three";

/**
 * Centralized "soft vinyl/clay toy" material system shared by every avatar
 * body-shape, part, and rendering context (editor, headshot, multiplayer,
 * museum) -- see AvatarModel.tsx for where each of these is assigned to a
 * mesh. Keeping the finish here (rather than inlined per-mesh) is what
 * guarantees a Rounded Cube and a Blob end up with the same physical
 * material response and only ever differ by color.
 *
 * Color-keyed materials are cached at module scope rather than recreated
 * per component instance: multiple avatars on screen at once (multiplayer)
 * that share a color share the same material object instead of each
 * allocating its own. The cache stays bounded by the fixed color palettes
 * in types/avatar.ts, so it never grows unbounded.
 */

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

function cached(key: string, create: () => THREE.MeshStandardMaterial) {
  let material = materialCache.get(key);
  if (!material) {
    material = create();
    materialCache.set(key, material);
  }
  return material;
}

/**
 * Body + limbs (arms and legs) all use this exact finish -- only the color
 * changes between them (body color vs. shoe color), so a differently
 * colored limb never reads as a separate, shinier part bolted onto a matte
 * body. roughness/metalness/envMapIntensity here are the values the rest of
 * this file's other finishes are calibrated relative to.
 *
 * roughness is pushed high (0.92) and envMapIntensity way down (0.1) so the
 * specular lobe is nearly gone and environment reflections barely register
 * -- a soft matte clay/vinyl read rather than satin or rubber. This does
 * NOT flatten the body's own light/dark shading gradient (that's a
 * diffuse/Lambertian response driven by scene lighting, not by roughness)
 * -- see the avatar-editor and headshot Canvas lighting for the fill-light
 * changes that soften that gradient.
 */
export function getBodyMaterial(hex: string): THREE.MeshStandardMaterial {
  return cached(
    `body:${hex}`,
    () =>
      new THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.92,
        metalness: 0,
        envMapIntensity: 0.1,
      })
  );
}

/**
 * Hair / head decorations: only a hair's-breadth smoother than the body
 * finish now -- enough to read as a distinct material up close, but still
 * solidly in matte territory. (This used to be a much bigger step down in
 * roughness, which is why dark decoration colors like top-hat charcoal
 * were reading as glossy/wet -- a low-roughness highlight is far more
 * visible against a dark base color than a light one.)
 */
export function getHairMaterial(hex: string): THREE.MeshStandardMaterial {
  return cached(
    `hair:${hex}`,
    () =>
      new THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.85,
        metalness: 0,
        envMapIntensity: 0.18,
      })
  );
}

interface AccessoryMaterialOptions {
  /** Only set this for an accessory that's meant to actually be metal.
   * Every current accessory (glasses) is not, so this defaults to false and
   * stays matte like everything else -- accessories don't get shiny just
   * because they're accessories. */
  metallic?: boolean;
}

export function getAccessoryMaterial(
  hex: string,
  options: AccessoryMaterialOptions = {}
): THREE.MeshStandardMaterial {
  const metallic = options.metallic ?? false;
  return cached(
    `accessory:${hex}:${metallic}`,
    () =>
      new THREE.MeshStandardMaterial(
        metallic
          ? { color: hex, roughness: 0.3, metalness: 0.85, envMapIntensity: 0.9 }
          : { color: hex, roughness: 0.7, metalness: 0, envMapIntensity: 0.15 }
      )
  );
}

/**
 * Eyes get their own, slightly glossier finish than the rest of the face --
 * a deliberate exception (per design direction: eyes should still feel
 * "alive") to the otherwise-matte hierarchy. Still no metalness, and
 * envMapIntensity stays modest so it's a soft liveliness, not a glassy
 * sheen.
 */
export const eyeMaterial = new THREE.MeshStandardMaterial({
  color: "#33291f",
  roughness: 0.35,
  metalness: 0,
  envMapIntensity: 0.3,
});

/**
 * Mouth + eyebrows share one dark, matte, low-envMapIntensity material: a
 * roughness smoother than the body still reads as printed/embedded ink
 * rather than the body's own surface, while the low envMapIntensity keeps
 * these small shapes from catching bright environment reflections that
 * would make them look like floating glossy beads. Unlike the eyes, these
 * stay flat matte -- no "alive" glassiness intended here.
 */
export const faceFeatureMaterial = new THREE.MeshStandardMaterial({
  color: "#33291f",
  roughness: 0.75,
  metalness: 0,
  envMapIntensity: 0.08,
});

/**
 * The small eye catchlight is a deliberate readability highlight, not a
 * surface finish -- it keeps its own emissive glow but has zero
 * envMapIntensity so it never also tints itself with an environment
 * reflection on top of that glow.
 */
export const eyeHighlightMaterial = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.25,
  metalness: 0,
  envMapIntensity: 0,
  emissive: "#ffffff",
  emissiveIntensity: 0.12,
});
