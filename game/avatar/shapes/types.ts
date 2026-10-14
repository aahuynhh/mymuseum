import * as THREE from "three";
import type { BodyShape } from "@/types/avatar";

/** A named attachment point in the shape's own local space (shape center = origin). */
export interface ShapeAnchor {
  position: [number, number, number];
  rotation?: [number, number, number];
  /** Per-axis scale applied to the part at this anchor. Defaults to [1,1,1]. */
  scale?: [number, number, number];
}

/**
 * Every body shape publishes the same anchor names so AvatarModel can place
 * generic, shape-agnostic parts (eyes, limbs, decorations, accessories)
 * without knowing which silhouette it's rendering -- this is what lets
 * customization "adapt to each body shape rather than clipping through it":
 * swap the shape, and every part re-flows to the new anchors automatically
 * instead of needing its own hand-tuned copy of every position.
 */
export interface ShapeAnchors {
  /** Center of the front face -- reference point for face-relative accessories. */
  face: ShapeAnchor;
  /** Eyes and mouth each carry their own independently-sampled surface depth
   * (not just an offset from `face`) -- on a curved or tapered shape, the
   * surface at the mouth's height can sit meaningfully forward or back of
   * the surface at eye height, and reusing one z for every feature left the
   * mouth embedded inside (invisible) on several shapes. */
  eyeLeft: ShapeAnchor;
  eyeRight: ShapeAnchor;
  mouth: ShapeAnchor;
  /** Where glasses sit, slightly forward of `face` to avoid z-fighting. */
  faceAccessory: ShapeAnchor;
  /** Top of the shape, where the head decoration (sprout/top-hat/spiky-hair) attaches. */
  headDecoration: ShapeAnchor;
  /** Bottom attachment points for the two stub legs. */
  legLeft: ShapeAnchor;
  legRight: ShapeAnchor;
}

export interface BodyShapeDefinition {
  id: BodyShape;
  label: string;
  /** The single dominant mesh -- the character's whole silhouette. */
  geometry: THREE.BufferGeometry;
  anchors: ShapeAnchors;
  /** World-space Y the character's feet should rest at when standing. */
  groundOffset: number;
  /** Approximate total height, used to frame preview/headshot cameras. */
  approxHeight: number;
}
