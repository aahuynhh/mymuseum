"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { GalleryRoom, WallOpening, WallSide } from "@/types";
import { getGalleryTheme } from "@/game/museum/themes";

const THICKNESS = 0.2;
const SIDES: WallSide[] = ["north", "south", "east", "west"];

interface Segment {
  start: number;
  end: number;
}

function wallSegments(spanMin: number, spanMax: number, opening?: WallOpening) {
  if (!opening) return { segments: [{ start: spanMin, end: spanMax }] as Segment[], opening: null };
  const left = opening.center - opening.width / 2;
  const right = opening.center + opening.width / 2;
  const segments: Segment[] = [];
  if (left > spanMin + 0.01) segments.push({ start: spanMin, end: left });
  if (right < spanMax - 0.01) segments.push({ start: right, end: spanMax });
  return { segments, opening };
}

export function Walls({ room }: { room: GalleryRoom }) {
  const theme = getGalleryTheme(room.theme);
  const { bounds, height } = room;

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: theme.wallColor, roughness: 0.9 }),
    [theme.wallColor]
  );
  const trimMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: theme.trimColor, roughness: 0.55 }),
    [theme.trimColor]
  );
  const railMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: theme.railColor, roughness: 0.5 }),
    [theme.railColor]
  );

  const headerHeight = height * 0.2;
  const railY = height * 0.56;

  return (
    <group>
      {SIDES.map((side) => {
        const isNS = side === "north" || side === "south";
        const boundary = side === "north" ? bounds.minZ : side === "south" ? bounds.maxZ : side === "east" ? bounds.maxX : bounds.minX;
        // Every wall is kept entirely on its own room's side of the boundary
        // line -- its outer face sits flush with `boundary`, and it extends
        // THICKNESS further into the room from there. Two rooms sharing a
        // boundary each render their own full-color wall this way; the two
        // are adjacent, never coplanar, so there's no z-fighting, and
        // neither room's doorway ever shows the other room's wall color.
        const inward = side === "north" ? 1 : side === "south" ? -1 : side === "east" ? -1 : 1;
        const fixed = boundary + inward * (THICKNESS / 2);
        // Baseboard is deliberately thicker than the wall (THICKNESS + 0.01)
        // so it visibly pokes out -- but centering that extra depth on the
        // same `fixed` as the wall let it overhang past `boundary` on the
        // outer side too, 0.005 into the neighboring room. Two rooms' trim
        // then overlapped in that sliver and flickered at every doorway.
        // Centering on its OWN fixed point instead keeps its outer face
        // flush with `boundary`, same as the wall, with all the extra
        // thickness going inward only.
        const baseboardFixed = boundary + inward * ((THICKNESS + 0.01) / 2);
        const spanMin = isNS ? bounds.minX : bounds.minZ;
        const spanMax = isNS ? bounds.maxX : bounds.maxZ;
        const opening = room.openings.find((o) => o.wall === side);
        const { segments } = wallSegments(spanMin, spanMax, opening);

        return (
          <group key={side}>
            {segments.map((seg, i) => {
              const mid = (seg.start + seg.end) / 2;
              const length = seg.end - seg.start;
              if (length <= 0.02) return null;
              const position: [number, number, number] = isNS
                ? [mid, height / 2, fixed]
                : [fixed, height / 2, mid];
              const args: [number, number, number] = isNS
                ? [length, height, THICKNESS]
                : [THICKNESS, height, length];
              // Baseboard is deeper than the wall (THICKNESS + 0.01) but was
              // given the SAME length as its wall segment, so at a segment's
              // cut end (a doorway jamb, where the segment stops mid-span
              // instead of running into a perpendicular wall) its own
              // end-cap face sat exactly coplanar with the wall's own
              // end-cap face -- a real, visible overlap (~0.15 tall by ~0.2
              // deep), not a hairline. At an ordinary room corner this was
              // hidden behind the perpendicular wall's geometry, which is
              // why it only ever showed up at doorways. Trimming the
              // baseboard's length slightly shorter than the wall moves its
              // end cap off that shared plane entirely.
              const baseboardLength = Math.max(0, length - 0.03);
              const baseboardPosition: [number, number, number] = isNS
                ? [mid, 0.075, baseboardFixed]
                : [baseboardFixed, 0.075, mid];
              const baseboardArgs: [number, number, number] = isNS
                ? [baseboardLength, 0.15, THICKNESS + 0.01]
                : [THICKNESS + 0.01, 0.15, baseboardLength];
              const railPosition: [number, number, number] = isNS
                ? [mid, railY, fixed]
                : [fixed, railY, mid];
              // Same end-cap overlap as the baseboard (its own end-cap face
              // sat coplanar with the wall's at a segment's cut end), just
              // smaller in area since the rail is thin. Trimmed for the same
              // reason and by the same amount, for consistency.
              const railArgs: [number, number, number] = isNS
                ? [baseboardLength, 0.035, 0.02]
                : [0.02, 0.035, baseboardLength];

              return (
                <group key={i}>
                  <mesh position={position} material={material} receiveShadow castShadow>
                    <boxGeometry args={args} />
                  </mesh>
                  <mesh position={baseboardPosition} material={trimMaterial}>
                    <boxGeometry args={baseboardArgs} />
                  </mesh>
                  {height > 3 && (
                    <mesh position={railPosition} material={railMaterial}>
                      <boxGeometry args={railArgs} />
                    </mesh>
                  )}
                </group>
              );
            })}

            {opening && (
              <>
                {/* Header lintel above the opening */}
                <mesh
                  position={
                    isNS
                      ? [opening.center, height - headerHeight / 2, fixed]
                      : [fixed, height - headerHeight / 2, opening.center]
                  }
                  material={material}
                  receiveShadow
                >
                  <boxGeometry
                    args={isNS ? [opening.width, headerHeight, THICKNESS] : [THICKNESS, headerHeight, opening.width]}
                  />
                </mesh>
                {/* Door frame posts, only for the museum's single front door */}
                {opening.isEntrance && (
                  <>
                    <mesh
                      position={
                        isNS
                          ? [opening.center - opening.width / 2, height * 0.4, fixed]
                          : [fixed, height * 0.4, opening.center - opening.width / 2]
                      }
                      material={trimMaterial}
                    >
                      <boxGeometry args={isNS ? [0.08, height * 0.8, 0.24] : [0.24, height * 0.8, 0.08]} />
                    </mesh>
                    <mesh
                      position={
                        isNS
                          ? [opening.center + opening.width / 2, height * 0.4, fixed]
                          : [fixed, height * 0.4, opening.center + opening.width / 2]
                      }
                      material={trimMaterial}
                    >
                      <boxGeometry args={isNS ? [0.08, height * 0.8, 0.24] : [0.24, height * 0.8, 0.08]} />
                    </mesh>
                  </>
                )}
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}
