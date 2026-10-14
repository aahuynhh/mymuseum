import * as THREE from "three";
import { LIMB_HALF_HEIGHT } from "../geometry";

/**
 * Samples a shape's *actual* geometry surface (via raycasting) to place the
 * face flush against it, instead of a hand-derived formula per shape (a
 * box's flat side, a sphere's constant radius, and a 3-sided prism's
 * tapering apothem all need different formulas, and the taper one was
 * miscalculated for the soft-triangle). This works identically for a box, a
 * sphere, a tapered prism, a capsule, or a perturbed blob.
 *
 * Leg placement uses `bottomSurfaceY`, sampling the shape's actual
 * underside directly instead of its front face -- reusing `frontDepth` for
 * that (an earlier version of this file did) is what made legs read as
 * pasted onto the front on tapered/curved shapes: it finds where the
 * front-facing surface is, which is a different point than where the
 * underside actually is.
 */

const raycaster = new THREE.Raycaster();
const probe = new THREE.Mesh();
// Every avatar geometry is built centered on the origin with no further
// transform, so the probe mesh's (identity) matrixWorld is already correct.
const FAR = 3;

function surfaceAt(
  geometry: THREE.BufferGeometry,
  origin: THREE.Vector3,
  direction: THREE.Vector3
): THREE.Vector3 | null {
  probe.geometry = geometry;
  raycaster.set(origin, direction);
  raycaster.near = 0;
  raycaster.far = FAR * 2 + 1;
  const hit = raycaster.intersectObject(probe, false)[0];
  return hit ? hit.point : null;
}

/** Z of the shape's front-facing surface directly above local (x, y), or `null` if nothing is there. */
export function frontDepth(geometry: THREE.BufferGeometry, x: number, y: number): number | null {
  const point = surfaceAt(geometry, new THREE.Vector3(x, y, FAR), new THREE.Vector3(0, 0, -1));
  return point ? point.z : null;
}

/** Y of the shape's bottom-facing (underside) surface directly below local
 * (x, z), or `null` if there's no material on that column at all (e.g. a
 * narrow taper sampled past its own edge). This is the one query every
 * shape's leg attachment should go through -- it answers "where is the
 * underside here," which is a structurally different question (and a
 * different point) than "where is the front surface here." */
export function bottomSurfaceY(geometry: THREE.BufferGeometry, x: number, z: number): number | null {
  const point = surfaceAt(geometry, new THREE.Vector3(x, -FAR, z), new THREE.Vector3(0, 1, 0));
  return point ? point.y : null;
}

/**
 * Shared leg design system -- every shape uses this same scale, the same
 * small sink-into-the-body embed, and the same target standing height for
 * its feet, so legs read as one consistent design language across
 * silhouettes even though each shape picks its own (legX, legZ) attachment
 * point on its own underside.
 */
export const LEG_SCALE: [number, number, number] = [0.78, 0.68, 0.78];
const LEG_EMBED = 0.02;
const LEG_FLOOR_GAP = 0.03;
const LEG_DROP = 2 * LIMB_HALF_HEIGHT.leg * LEG_SCALE[1];
const LEG_PIVOT_TARGET_WORLD_Y = LEG_FLOOR_GAP + LEG_DROP;

/** The leg pivot's local Y at a given (x, z) on this shape's underside -- already includes the small sink-in embed. */
export function legPivotY(geometry: THREE.BufferGeometry, x: number, z: number, fallback: number): number {
  return (bottomSurfaceY(geometry, x, z) ?? fallback) + LEG_EMBED;
}

/** The groundOffset (how high this shape's own center stands above the
 * floor) that makes a leg pivoted at (legX, legY, legZ) land with its foot
 * just above y=0 -- the direct, physical consequence of "attach legs to the
 * real underside" instead of a hand-guessed per-shape standing height. */
export function groundOffsetForLegs(legY: number): number {
  return LEG_PIVOT_TARGET_WORLD_Y - legY;
}

export interface FaceAnchors {
  face: { position: [number, number, number] };
  eyeLeft: { position: [number, number, number] };
  eyeRight: { position: [number, number, number] };
  mouth: { position: [number, number, number] };
  faceAccessory: { position: [number, number, number] };
  headDecoration: { position: [number, number, number] };
}

export interface DeriveFaceAnchorsOptions {
  /** 0 (bottom of the shape) to 1 (top) -- where the face sits. Default 0.6. */
  faceHeightFraction?: number;
}

// Added to every sampled depth so a feature reliably pokes past the
// surface instead of sitting exactly flush with it -- flush placement is
// fragile: a thin feature like the mouth can end up embedded (invisible)
// from a tiny sampling/rounding difference alone.
const SURFACE_MARGIN = 0.015;

/** Builds the face/decoration/accessory anchors for a shape from its geometry. Limb anchors are supplied separately by each shape module. */
export function deriveFaceAnchors(
  geometry: THREE.BufferGeometry,
  options: DeriveFaceAnchorsOptions = {}
): FaceAnchors {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const halfWidth = Math.max(Math.abs(box.max.x), Math.abs(box.min.x));
  const fullHeight = box.max.y - box.min.y;

  const faceHeightFraction = options.faceHeightFraction ?? 0.6;
  const faceY = box.min.y + fullHeight * faceHeightFraction;
  const fallback = halfWidth * 0.7;
  const sampleZ = (x: number, y: number) => (frontDepth(geometry, x, y) ?? fallback) + SURFACE_MARGIN;

  const faceZ = sampleZ(0, faceY);

  // Eyes sit above the face point, mouth well below it -- each sampled at
  // its own (x, y), not borrowed from `face`, since the real surface depth
  // can differ meaningfully between them on a curved or tapered shape.
  const eyeY = faceY + 0.05;
  const eyeLeftX = -0.13;
  const eyeRightX = 0.13;
  const mouthY = faceY - 0.09;

  return {
    face: { position: [0, faceY, faceZ] },
    eyeLeft: { position: [eyeLeftX, eyeY, sampleZ(eyeLeftX, eyeY)] },
    eyeRight: { position: [eyeRightX, eyeY, sampleZ(eyeRightX, eyeY)] },
    mouth: { position: [0, mouthY, sampleZ(0, mouthY)] },
    faceAccessory: { position: [0, faceY, faceZ + 0.05] },
    headDecoration: { position: [0, box.max.y + 0.02, 0.03] },
  };
}
