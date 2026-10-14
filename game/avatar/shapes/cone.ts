import * as THREE from "three";
import type { BodyShapeDefinition } from "./types";
import { deriveFaceAnchors, groundOffsetForLegs, legPivotY, LEG_SCALE } from "./deriveAnchors";

// A smooth, round-cross-section cone -- the only tapered silhouette among
// the body shapes, distinct from the rounded-cube's flat faces and the
// capsule's uniform-width barrel. radiusTop is kept small but nonzero so the
// tip is a rounded cap, not a sharp point.
const RADIUS_BOTTOM = 0.46;
const RADIUS_TOP = 0.08;
const HEIGHT = 0.78;
const HALF_H = HEIGHT / 2;

const geometry = new THREE.CylinderGeometry(RADIUS_TOP, RADIUS_BOTTOM, HEIGHT, 24, 1);

// Legs attach to the flat circular base (Y is sampled from the underside,
// same as every other shape). Pulled back as close to true center (z=0) as
// this shape's silhouette allows: below ~0.13 the leg fades behind the
// smooth, continuously-curving wall from the standard camera angle (no hard
// corner to peek out from under, unlike a box, and no rotation of the leg
// itself compensates -- the attachment point itself is what's hidden). 0.14
// is the practical floor found by testing down from there in small steps.
const LEG_X = 0.09;
const LEG_Z = 0.14;
const legY = legPivotY(geometry, LEG_X, LEG_Z, -HALF_H);
const GROUND_OFFSET = groundOffsetForLegs(legY);

export const cone: BodyShapeDefinition = {
  id: "cone",
  label: "Cone",
  geometry,
  groundOffset: GROUND_OFFSET,
  approxHeight: GROUND_OFFSET + HALF_H + 0.1,
  anchors: {
    // Face sits a bit above vertical center, same reasoning as the
    // soft-triangle: low in the wide base is the zone the legs occupy.
    ...deriveFaceAnchors(geometry, { faceHeightFraction: 0.56 }),
    legLeft: { position: [-LEG_X, legY, LEG_Z], rotation: [0.12, 0, 0.09], scale: LEG_SCALE },
    legRight: { position: [LEG_X, legY, LEG_Z], rotation: [0.12, 0, -0.09], scale: LEG_SCALE },
  },
};
