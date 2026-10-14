"use client";

import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { GalleryRoom, WallSide } from "@/types";
import { getGalleryTheme } from "@/game/museum/themes";
import { wallSegments } from "@/game/museum/placement";

const THICKNESS = 0.2;
const SIDES: WallSide[] = ["north", "south", "east", "west"];
/** World units one wall-texture tile covers -- larger than the texture's
 * own natural tiling frequency would suggest, on purpose: a bigger tile
 * means each mottled blotch in the stucco photo is stretched larger across
 * the wall, so the texture reads as visible surface variation from normal
 * viewing distance instead of blending into a near-flat expanse. */
const WALL_TILE_SIZE = 3.2;
/** A real normal map (see public/textures/CREDITS.md -- derived from the
 * stucco material's own displacement/height data, not synthesized from the
 * diffuse photo) instead of reusing the diffuse map as a bumpMap. A plain
 * color `map` alone only ever shows up as flat blotches of slightly
 * different color, and bumpMap-from-diffuse only approximates relief from
 * color contrast, which isn't the same thing as the surface's actual
 * shape -- both undersold how present the stucco grain should look. A
 * genuine per-pixel normal map is what makes the directional light catch
 * and shade the grain correctly at grazing angles, not just flat-on. */
const WALL_NORMAL_TEXTURE = "/textures/walls/stucco-normal.png";
const WALL_NORMAL_SCALE = 1.1;
/** World units one trim-texture tile covers, along a strip's length -- much
 * smaller than the wall's tile size since a baseboard/rail is a thin strip,
 * not a broad surface, and wants a tighter, more molding-like grain. */
const TRIM_TILE_SIZE = 0.9;
const TRIM_TEXTURE = "/textures/floors/wood-base.png";
/** The wood pack's own normal/roughness maps (see CREDITS.md) -- trim
 * previously had no normalMap or roughnessMap at all, just a flat diffuse
 * tint, so even up close it read as a painted color rather than a milled
 * wood surface. */
const TRIM_NORMAL_TEXTURE = "/textures/floors/wood-normal.png";
const TRIM_ROUGHNESS_TEXTURE = "/textures/floors/wood-roughness.png";
const TRIM_NORMAL_SCALE = 0.7;

export function Walls({ room }: { room: GalleryRoom }) {
  const theme = getGalleryTheme(room.theme);
  const { bounds, height } = room;

  const wallTexture = useTexture(theme.wallTexture);
  const wallNormalTexture = useTexture(WALL_NORMAL_TEXTURE);

  // BoxGeometry's UVs are fixed 0-1 per face regardless of box size, so a
  // texture shared across differently-sized wall segments (doorways cut
  // segments to varying lengths) would tile at inconsistent scale. Each
  // segment gets its own texture clone with `repeat` set from its own
  // length/height, keeping texel density constant room-wide. Built once per
  // room (not per render) so re-renders don't keep re-uploading fresh GPU
  // textures for every wall segment. The normal map clone gets the exact
  // same `repeat` as the diffuse clone so the two stay pixel-aligned.
  const makeWallMaterial = useMemo(() => {
    return (length: number) => {
      const tex = wallTexture.clone();
      tex.needsUpdate = true;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.repeat.set(length / WALL_TILE_SIZE, height / WALL_TILE_SIZE);

      const normalTex = wallNormalTexture.clone();
      normalTex.needsUpdate = true;
      normalTex.wrapS = THREE.RepeatWrapping;
      normalTex.wrapT = THREE.RepeatWrapping;
      normalTex.repeat.copy(tex.repeat);

      return new THREE.MeshStandardMaterial({
        map: tex,
        normalMap: normalTex,
        normalScale: new THREE.Vector2(WALL_NORMAL_SCALE, WALL_NORMAL_SCALE),
        color: theme.wallColor,
        roughness: 0.88,
      });
    };
  }, [wallTexture, wallNormalTexture, theme.wallColor, height]);
  const trimTexture = useTexture(TRIM_TEXTURE);
  const trimNormalTexture = useTexture(TRIM_NORMAL_TEXTURE);
  const trimRoughnessTexture = useTexture(TRIM_ROUGHNESS_TEXTURE);

  // Same idea as makeWallMaterial -- a wood grain texture (the same one
  // Floor.tsx uses) tinted per-piece so the baseboard/rail/door-frame trim
  // still take each theme's own trimColor/railColor, just with real surface
  // detail instead of a flat fill. Each piece gets its own texture clone
  // with `repeat` scaled from its own length so a short door-frame post and
  // a long baseboard run don't tile at mismatched density. The normal and
  // roughness clones follow the same `repeat` as the diffuse clone so all
  // three stay aligned -- previously the trim had neither map at all, so
  // even the wood grain's own base-color contrast read as a flat painted
  // surface with no relief or specular variation.
  const makeTrimMaterial = useMemo(() => {
    return (length: number, color: string) => {
      const tex = trimTexture.clone();
      tex.needsUpdate = true;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.repeat.set(Math.max(1, length / TRIM_TILE_SIZE), 1);

      const normalTex = trimNormalTexture.clone();
      normalTex.needsUpdate = true;
      normalTex.wrapS = THREE.RepeatWrapping;
      normalTex.wrapT = THREE.RepeatWrapping;
      normalTex.repeat.copy(tex.repeat);

      const roughTex = trimRoughnessTexture.clone();
      roughTex.needsUpdate = true;
      roughTex.wrapS = THREE.RepeatWrapping;
      roughTex.wrapT = THREE.RepeatWrapping;
      roughTex.repeat.copy(tex.repeat);

      return new THREE.MeshStandardMaterial({
        map: tex,
        normalMap: normalTex,
        normalScale: new THREE.Vector2(TRIM_NORMAL_SCALE, TRIM_NORMAL_SCALE),
        roughnessMap: roughTex,
        color,
        roughness: 1,
      });
    };
  }, [trimTexture, trimNormalTexture, trimRoughnessTexture]);
  // Crown molding -- a pale, low-saturation off-white/cream reads as
  // painted plaster cornice against any wall color (unlike railColor, which
  // is tuned per-theme and would just look like a second, redundant
  // picture rail up at the ceiling). It's still cast plaster, so it gets
  // the same stucco normal map as the walls (no diffuse map -- the flat
  // cream tint is deliberate, see above) at a tight tiling since it's a
  // thin strip, not a broad surface -- otherwise a flat, mapless material
  // reads as painted plastic up close, which was exactly what made it look
  // flat next to the now-textured walls and trim.
  const crownMaterial = useMemo(() => {
    const normalTex = wallNormalTexture.clone();
    normalTex.needsUpdate = true;
    normalTex.wrapS = THREE.RepeatWrapping;
    normalTex.wrapT = THREE.RepeatWrapping;
    normalTex.repeat.set(6, 1);
    return new THREE.MeshStandardMaterial({
      color: "#ede4d3",
      normalMap: normalTex,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.6,
    });
  }, [wallNormalTexture]);

  const headerHeight = height * 0.2;
  const railY = height * 0.56;
  const crownY = height - 0.09;

  // Precomputes each side's geometry AND its per-segment wall material
  // together, once per room, so material/texture instances are created
  // exactly once rather than on every render.
  const sideLayout = useMemo(
    () =>
      SIDES.map((side) => {
        const isNS = side === "north" || side === "south";
        const boundary = side === "north" ? bounds.minZ : side === "south" ? bounds.maxZ : side === "east" ? bounds.maxX : bounds.minX;
        const inward = side === "north" ? 1 : side === "south" ? -1 : side === "east" ? -1 : 1;
        const fixed = boundary + inward * (THICKNESS / 2);
        const baseboardFixed = boundary + inward * ((THICKNESS + 0.05) / 2);
        const spanMin = isNS ? bounds.minX : bounds.minZ;
        const spanMax = isNS ? bounds.maxX : bounds.maxZ;
        const opening = room.openings.find((o) => o.wall === side);
        const { segments } = wallSegments(spanMin, spanMax, opening);
        const headerMaterial = opening ? makeWallMaterial(opening.width) : null;
        const doorPostMaterial =
          opening?.isEntrance ? makeTrimMaterial(height * 0.8, theme.trimColor) : null;

        return {
          side,
          isNS,
          fixed,
          baseboardFixed,
          inward,
          opening,
          headerMaterial,
          doorPostMaterial,
          segments: segments.map((seg) => {
            const length = seg.end - seg.start;
            const baseboardLength = Math.max(0, length - 0.09);
            return {
              ...seg,
              material: makeWallMaterial(length),
              baseboardMaterial: makeTrimMaterial(baseboardLength, theme.trimColor),
              railTrimMaterial: makeTrimMaterial(baseboardLength, theme.railColor),
            };
          }),
        };
      }),
    [bounds, room.openings, height, makeWallMaterial, makeTrimMaterial, theme.trimColor, theme.railColor]
  );

  return (
    <group>
      {sideLayout.map(({ side, isNS, fixed, baseboardFixed, inward, opening, headerMaterial, doorPostMaterial, segments }) => {
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
              // Baseboard is deeper than the wall (THICKNESS + 0.05, enough
              // to protrude clearly and stay legible even against a dark
              // wall color or at a raking angle through a doorway -- the
              // previous +0.01 margin was thin enough to read as barely
              // there, especially viewed from an adjacent room) but given
              // the SAME length as its wall segment, so at a segment's cut
              // end (a doorway jamb, where the segment stops mid-span
              // instead of running into a perpendicular wall) its own
              // end-cap face sat exactly coplanar with the wall's own
              // end-cap face -- a real, visible overlap, not a hairline. At
              // an ordinary room corner this was hidden behind the
              // perpendicular wall's geometry, which is why it only ever
              // showed up at doorways. Trimming the baseboard's length
              // shorter than the wall (proportional to the deeper
              // protrusion) moves its end cap off that shared plane
              // entirely.
              const baseboardLength = Math.max(0, length - 0.09);
              const baseboardPosition: [number, number, number] = isNS
                ? [mid, 0.075, baseboardFixed]
                : [baseboardFixed, 0.075, mid];
              const baseboardArgs: [number, number, number] = isNS
                ? [baseboardLength, 0.15, THICKNESS + 0.05]
                : [THICKNESS + 0.05, 0.15, baseboardLength];
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
              // Crown molding -- same footprint as the baseboard (deeper
              // than the wall so it visibly protrudes, trimmed shorter than
              // the wall so its end cap clears a doorway jamb) but mounted
              // at the ceiling line instead of the floor.
              const crownPosition: [number, number, number] = isNS
                ? [mid, crownY, baseboardFixed]
                : [baseboardFixed, crownY, mid];
              const crownArgs: [number, number, number] = isNS
                ? [baseboardLength, 0.16, THICKNESS + 0.06]
                : [THICKNESS + 0.06, 0.16, baseboardLength];

              return (
                <group key={i}>
                  <mesh position={position} material={seg.material} receiveShadow castShadow>
                    <boxGeometry args={args} />
                  </mesh>
                  <mesh position={baseboardPosition} material={seg.baseboardMaterial}>
                    <boxGeometry args={baseboardArgs} />
                  </mesh>
                  {height > 3 && (
                    <mesh position={railPosition} material={seg.railTrimMaterial}>
                      <boxGeometry args={railArgs} />
                    </mesh>
                  )}
                  {/* No castShadow -- baseboard/rail don't cast either, and
                      a room can have up to ~8 of these (4 walls x up to 2
                      segments where a doorway splits one), all contributing
                      to the shadow-map pass for a thin ceiling-line strip
                      that's rarely what casts a visible shadow anyway. */}
                  <mesh position={crownPosition} material={crownMaterial}>
                    <boxGeometry args={crownArgs} />
                  </mesh>
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
                  material={headerMaterial ?? undefined}
                  receiveShadow
                >
                  <boxGeometry
                    args={isNS ? [opening.width, headerHeight, THICKNESS] : [THICKNESS, headerHeight, opening.width]}
                  />
                </mesh>
                {/* Crown molding across the doorway, matching the header's
                    width. The per-segment crown pieces above stop at each
                    segment's own span, which excludes the opening -- with
                    nothing bridging that gap, the molding line visibly cut
                    out and picked back up at every doorway ("stops
                    randomly," reported against the demo museum, which has
                    several). A real cornice continues over a doorway rather
                    than breaking there, so this closes that gap the same
                    way the header lintel already closes the wall gap below
                    it.

                    The per-segment crown pieces are also each trimmed 0.045
                    short of their own segment's true end (same reason the
                    baseboard is trimmed -- see baseboardLength above), so
                    matching this bridging piece exactly to opening.width
                    left a hairline gap at both jambs instead of closing it.
                    Widening it by that same 0.045 on each side makes it
                    overlap the trimmed segment ends instead of just
                    touching them. */}
                <mesh
                  position={
                    isNS ? [opening.center, crownY, baseboardFixed] : [baseboardFixed, crownY, opening.center]
                  }
                  material={crownMaterial}
                >
                  <boxGeometry
                    args={
                      isNS
                        ? [opening.width + 0.09, 0.16, THICKNESS + 0.06]
                        : [THICKNESS + 0.06, 0.16, opening.width + 0.09]
                    }
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
                      material={doorPostMaterial ?? undefined}
                    >
                      <boxGeometry args={isNS ? [0.08, height * 0.8, 0.24] : [0.24, height * 0.8, 0.08]} />
                    </mesh>
                    <mesh
                      position={
                        isNS
                          ? [opening.center + opening.width / 2, height * 0.4, fixed]
                          : [fixed, height * 0.4, opening.center + opening.width / 2]
                      }
                      material={doorPostMaterial ?? undefined}
                    >
                      <boxGeometry args={isNS ? [0.08, height * 0.8, 0.24] : [0.24, height * 0.8, 0.08]} />
                    </mesh>
                    {/* Daylight backdrop, just outside the front door. This
                        opening doesn't connect to another room -- nothing is
                        modeled beyond it -- and the player's movement is
                        already clamped so they can never actually reach the
                        other side (no connector bridges it in data/rooms.ts).
                        Without this, looking toward the entrance from
                        anywhere inside showed straight through the doorway
                        into pure unrendered black void, which read as a
                        rendering glitch rather than the dead end it actually
                        is. A simple soft-daylight plane closes that gap with
                        something that reads as "outside," not "broken." */}
                    <mesh
                      position={
                        isNS
                          ? [opening.center, height * 0.45, fixed - inward * 0.4]
                          : [fixed - inward * 0.4, height * 0.45, opening.center]
                      }
                      rotation={isNS ? [0, 0, 0] : [0, Math.PI / 2, 0]}
                    >
                      <planeGeometry args={[opening.width * 1.3, height * 0.9]} />
                      <meshBasicMaterial color="#cfe3ee" side={THREE.DoubleSide} />
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
