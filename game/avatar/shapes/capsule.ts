import * as THREE from "three";
import type { BodyShapeDefinition } from "./types";
import { deriveFaceAnchors, groundOffsetForLegs, legPivotY, LEG_SCALE } from "./deriveAnchors";

// A tall, slim pill -- a genuine straight cylindrical midsection (unlike the
// rounded-cube's flat faces or the sphere/bean's continuous curve), which is
// what should read as clearly distinct: narrower and taller than every other
// silhouette.
const RADIUS = 0.34;
const STRAIGHT_LENGTH = 0.42;
const HALF_H = STRAIGHT_LENGTH / 2 + RADIUS;

const geometry = new THREE.CapsuleGeometry(RADIUS, STRAIGHT_LENGTH, 8, 16);

// Legs match the rounded-cube's stance width so leg spacing reads
// consistently across body shapes, near the bottom cap's curve.
const LEG_X = 0.09;
const LEG_Z = 0.05;
const legY = legPivotY(geometry, LEG_X, LEG_Z, -HALF_H);
const GROUND_OFFSET = groundOffsetForLegs(legY);

export const capsule: BodyShapeDefinition = {
  id: "capsule",
  label: "Capsule",
  geometry,
  groundOffset: GROUND_OFFSET,
  approxHeight: GROUND_OFFSET + HALF_H + 0.15,
  anchors: {
    ...deriveFaceAnchors(geometry, { faceHeightFraction: 0.64 }),
    legLeft: { position: [-LEG_X, legY, LEG_Z], rotation: [0.12, 0, 0.09], scale: LEG_SCALE },
    legRight: { position: [LEG_X, legY, LEG_Z], rotation: [0.12, 0, -0.09], scale: LEG_SCALE },
  },
};
