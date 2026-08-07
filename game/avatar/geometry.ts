import * as THREE from "three";

/**
 * Shared geometry instances for the MyMuseum avatar. Every avatar in the
 * scene (local player, remote players, landing-page preview) reuses the same
 * BufferGeometry objects rather than allocating new ones per instance --
 * only materials (which carry per-avatar color) differ.
 *
 * Proportions favor a soft, rounded "collectible toy" silhouette: a
 * generously large head, a short-and-round torso (a capsule with almost no
 * straight section reads as a blob rather than a pill), rounded shoulder
 * caps, and a single smoothly tapered arm (wide at the shoulder, narrow at
 * the wrist) rather than a chain of separate segments -- one continuous
 * surface instead of a string of visible joints.
 *
 * Face/hair pieces are sized with a deliberate margin *outside* the head
 * sphere's radius (0.45) so they sit proud of the scalp/skin rather than
 * skimming its surface -- a small numerical margin there is what causes
 * clipping as the avatar rotates, so pieces here err on the side of a
 * visibly safe gap.
 */
const HEAD_RADIUS = 0.45;

export const avatarGeometry = {
  head: new THREE.SphereGeometry(HEAD_RADIUS, 28, 22),
  // Radius matches the waistband's own radius (0.31, below) so the torso
  // reads as one consistent thickness through to the waist instead of
  // narrowing above it.
  torso: new THREE.CapsuleGeometry(0.31, 0.14, 8, 16),
  hip: new THREE.SphereGeometry(0.32, 20, 16),
  collar: new THREE.TorusGeometry(0.165, 0.026, 10, 24),
  // The torso's bottom hemisphere and the hip sphere overlap heavily (by
  // design, so the body reads as one continuous blob with no gap) -- but
  // that means where shirt-color ends and pants-color begins is decided by
  // whichever surface the z-buffer happens to resolve as nearer, which
  // shifts as the camera orbits instead of sitting at one clean line. This
  // waistband masks that ambiguous zone with a deliberate seam, the same
  // way `collar` already does at the neckline. Tube kept thin (unlike an
  // earlier version at 0.045) so it reads as a slim belt-line seam rather
  // than a separate inflated ring -- it only needs to clear the torso/hip
  // surfaces at this height (~0.30) by a small margin, not stand proud of
  // them.
  waistband: new THREE.TorusGeometry(0.305, 0.015, 10, 24),
  shoulder: new THREE.SphereGeometry(0.1, 16, 12),
  // A single tapered tube (wide at the shoulder, narrow at the wrist) --
  // open-ended so its flat caps are hidden inside the shoulder/hand spheres,
  // reading as one continuous smooth limb instead of stacked segments.
  // radiusTop matches the shoulder sphere's own radius (0.1) so the arm
  // continues its width rather than stepping down, and it's kept short and
  // stubby for a cute, chibi proportion rather than a realistic reach.
  arm: new THREE.CylinderGeometry(0.098, 0.06, 0.18, 14, 1, true),
  hand: new THREE.SphereGeometry(0.095, 14, 12),
  leg: new THREE.CapsuleGeometry(0.118, 0.15, 6, 10),
  // Flattened + elongated (via non-uniform scale where used) into a rounded shoe.
  shoe: new THREE.SphereGeometry(0.135, 16, 12),

  // -- Hair -----------------------------------------------------------
  // thetaLength is kept well short of the eye latitude (~0.49*PI) so hair
  // covers the scalp/sides without engulfing the face from any angle.
  hairCap: new THREE.SphereGeometry(HEAD_RADIUS + 0.035, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.42),
  // A smaller, higher cap for twin-buns -- shallow enough that squashing it
  // for the "pulled back" base never brings its rim inside the head, unlike
  // stretching the full-size cap down toward the equator would.
  hairCrown: new THREE.SphereGeometry(HEAD_RADIUS + 0.03, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.3),
  hairBun: new THREE.SphereGeometry(0.115, 14, 12),
  // A rounded dome segment (not a cone) swept asymmetrically for a soft,
  // toy-like "swoop" that hugs the head rather than a sharp, floating point.
  hairSwoop: new THREE.SphereGeometry(HEAD_RADIUS + 0.045, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.42),

  // -- Face -------------------------------------------------------------
  eye: new THREE.SphereGeometry(0.05, 12, 10),
  eyeHighlight: new THREE.SphereGeometry(0.016, 8, 6),
  // A small flattened sphere rather than a flat disc: spheres read correctly
  // from every angle without needing a precisely-computed surface normal,
  // so blush can't clip in/out the way a mis-rotated flat circle did.
  cheek: new THREE.SphereGeometry(0.065, 12, 10),

  // -- Accessories --------------------------------------------------------
  glassesRing: new THREE.TorusGeometry(0.095, 0.016, 8, 20),
  glassesBridge: new THREE.CylinderGeometry(0.012, 0.012, 0.13, 6),
  // Same "shell bigger than everything it sits over" rule as the hair
  // pieces: radius clears even the tallest hair shell (hairSwoop, at
  // HEAD_RADIUS + 0.045) with margin to spare, so a small tilt/translation
  // can never bring it inside the head or the hair beneath it. thetaLength
  // is kept well under the ~0.49*PI eye latitude (see hairCap) WITH a
  // further margin beyond that, because the beret is worn tilted (see its
  // rotation in AvatarModel.tsx) -- that tilt dips the rim lower than
  // thetaLength alone suggests on whichever side it leans toward, so the
  // flat (unrotated) coverage angle needs real headroom below the eyes.
  beret: new THREE.SphereGeometry(HEAD_RADIUS + 0.07, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.36),
  // A crossbody bag (strap + pouch) anchored to the torso instead of a
  // hand-hung tote -- it stays correctly placed regardless of arm pose.
  bagStrap: new THREE.BoxGeometry(0.075, 0.62, 0.03),
  bagPouch: new THREE.BoxGeometry(0.2, 0.22, 0.09),
};
