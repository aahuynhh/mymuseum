import { RoundedBoxGeometry } from "three-stdlib";
import type { BodyShapeDefinition } from "./types";
import { deriveFaceAnchors, groundOffsetForLegs, legPivotY, LEG_SCALE } from "./deriveAnchors";

// Half-extents, kept as named constants for groundOffset/approxHeight below
// -- changing the body's size can't silently desync from where it stands.
const WIDTH = 0.86;
const HEIGHT = 0.8;
const DEPTH = 0.62;
const HALF_H = HEIGHT / 2;

const geometry = new RoundedBoxGeometry(WIDTH, HEIGHT, DEPTH, 4, 0.16);

// Legs attach toward the middle of the flat underside, sampled from the
// real geometry (see deriveAnchors.ts) rather than assumed -- see the
// shared LEG_SCALE/groundOffsetForLegs system.
const LEG_X = 0.09;
const LEG_Z = 0.05;
const legY = legPivotY(geometry, LEG_X, LEG_Z, -HALF_H);
const GROUND_OFFSET = groundOffsetForLegs(legY);

export const roundedCube: BodyShapeDefinition = {
  id: "rounded-cube",
  label: "Rounded Cube",
  // segments=4 keeps the rounded edges faceted/low-poly rather than smooth,
  // which reads as a deliberate toy-block chamfer -- flat faces and a boxy
  // silhouette distinct from the cone's taper and the capsule's continuous
  // curve.
  geometry,
  groundOffset: GROUND_OFFSET,
  approxHeight: GROUND_OFFSET + HALF_H + 0.15,
  anchors: {
    ...deriveFaceAnchors(geometry, { faceHeightFraction: 0.75 }),
    legLeft: { position: [-LEG_X, legY, LEG_Z], rotation: [0.12, 0, 0.09], scale: LEG_SCALE },
    legRight: { position: [LEG_X, legY, LEG_Z], rotation: [0.12, 0, -0.09], scale: LEG_SCALE },
  },
};
