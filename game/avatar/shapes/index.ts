import type { BodyShape } from "@/types/avatar";
import type { BodyShapeDefinition } from "./types";
import { roundedCube } from "./roundedCube";
import { capsule } from "./capsule";
import { cone } from "./cone";

export type { BodyShapeDefinition, ShapeAnchor, ShapeAnchors } from "./types";

export const bodyShapes: Record<BodyShape, BodyShapeDefinition> = {
  "rounded-cube": roundedCube,
  capsule,
  cone,
};
