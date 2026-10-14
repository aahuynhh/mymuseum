import * as THREE from "three";

/** A flat, hollow-ring lens frame -- an outer path with a smaller matching
 * inner path cut out as a hole, extruded to a thin slab. Used to build
 * glasses lenses in shapes a torus can't make (square, ...). */
function ringFrame(outerPoints: THREE.Vector2[], innerPoints: THREE.Vector2[]): THREE.BufferGeometry {
  const shape = new THREE.Shape(outerPoints);
  shape.holes.push(new THREE.Path(innerPoints));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.022, bevelEnabled: false });
  geometry.center();
  return geometry;
}

function squarePoints(halfSize: number): THREE.Vector2[] {
  return [
    new THREE.Vector2(-halfSize, -halfSize),
    new THREE.Vector2(halfSize, -halfSize),
    new THREE.Vector2(halfSize, halfSize),
    new THREE.Vector2(-halfSize, halfSize),
  ];
}

/**
 * Shared, shape-agnostic part geometries for the MyMuseum avatar. The
 * dominant silhouette itself (the one big geometric body shape a character
 * is built from) lives per-shape in game/avatar/shapes/ -- everything here
 * is small, generic, and reused unmodified across every body shape: stub
 * limbs, face features, head decorations, and accessories. AvatarModel
 * positions these using the active shape's named anchors, so switching body
 * shapes re-flows every part automatically instead of needing a hand-tuned
 * copy of each piece per silhouette.
 *
 * All instances are module-level singletons (allocated once, reused across
 * every avatar in the scene) -- only materials differ per avatar instance.
 */
// Half the total height of limbLeg below (radius*2 + length, halved) --
// exported so both AvatarModel (which offsets the leg mesh by exactly its
// own half-height so the mesh's *top* sits at its pivot) and shape modules
// (which need to know how far a leg actually drops from its pivot, to
// place that pivot correctly) share one source of truth instead of two
// copies of the same numbers silently drifting apart.
export const LIMB_HALF_HEIGHT = { leg: 0.12 };

export const avatarGeometry = {
  // -- Limbs --------------------------------------------------------------
  // Short capsule, not a segmented chain -- no knees, deliberately reading
  // as a stubby toy limb rather than realistic anatomy. Sized small so the
  // body silhouette (not the limbs) stays the dominant visual feature;
  // per-shape ShapeAnchor.scale adjusts further from this base.
  limbLeg: new THREE.CapsuleGeometry(0.095, 0.05, 6, 10),

  // -- Face -----------------------------------------------------------------
  // Small flattened spheres (via non-uniform scale at use-site) rather than
  // flat discs, so they read correctly as a slight bump from every angle.
  eye: new THREE.SphereGeometry(0.045, 14, 10),
  eyeHighlight: new THREE.SphereGeometry(0.014, 8, 6),
  // A half-torus arc for a simple curved smile -- the same geometry reads
  // as a frown when rotated the other way (see AvatarModel's expression
  // branching), so "sad"/"mad" don't need a separate mouth shape.
  mouth: new THREE.TorusGeometry(0.035, 0.009, 6, 12, Math.PI),
  // -- Expression parts -----------------------------------------------------
  // "happy" -- a small closed-eye upward arc (a squinty ^‿^ curve) instead
  // of a round dot.
  eyeHappyArc: new THREE.TorusGeometry(0.038, 0.011, 6, 10, Math.PI * 0.85),
  // A short flattened bar, reused (rotated per use-site) as an eyebrow for
  // sad/mad/confused, and as a small flat "unsure" mouth line for confused.
  browBar: new THREE.CapsuleGeometry(0.008, 0.045, 4, 6),
  // "excited" -- a small flattened oval for an open, gasping mouth.
  mouthOpen: new THREE.SphereGeometry(0.026, 10, 8),

  // -- Head decoration ------------------------------------------------------
  // "sprout" -- a thin stem with two small leaf bumps.
  sproutStem: new THREE.CylinderGeometry(0.013, 0.017, 0.15, 6),
  sproutLeaf: new THREE.SphereGeometry(0.05, 10, 8),
  // "top-hat" -- a short cylindrical crown on a thin, wide brim disc.
  topHatCrown: new THREE.CylinderGeometry(0.13, 0.14, 0.19, 16),
  topHatBrim: new THREE.CylinderGeometry(0.21, 0.21, 0.025, 20),
  // "spiky-hair" -- five narrow cones fanned around the crown, each tilted
  // outward at use-site so they read as a spiky tuft rather than a single
  // straight point.
  spike: new THREE.ConeGeometry(0.032, 0.16, 8),

  // -- Accessories ------------------------------------------------------------
  glassesRing: new THREE.TorusGeometry(0.07, 0.012, 8, 18),
  glassesSquare: ringFrame(squarePoints(0.075), squarePoints(0.05)),
  glassesBridge: new THREE.CylinderGeometry(0.01, 0.01, 0.1, 6),
};
