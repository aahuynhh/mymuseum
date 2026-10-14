"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Billboard, Text } from "@react-three/drei";
import { avatarGeometry, LIMB_HALF_HEIGHT } from "@/game/avatar/geometry";
import { bodyShapes } from "@/game/avatar/shapes";
import type { ShapeAnchor } from "@/game/avatar/shapes";
import {
  eyeHighlightMaterial,
  eyeMaterial,
  faceFeatureMaterial,
  getAccessoryMaterial,
  getBodyMaterial,
  getHairMaterial,
} from "@/game/avatar/materials";
import type { AnimationState, AvatarConfiguration } from "@/types";
import { BODY_COLOR_OPTIONS, HAIR_COLOR_OPTIONS, SHOES_OPTIONS } from "@/types/avatar";

function hexFor<T extends { value: string; hex: string }>(
  options: T[],
  value: string,
  fallback: string
) {
  return options.find((o) => o.value === value)?.hex ?? fallback;
}

/** Anchor position plus a local offset -- used to nudge a part forward/up
 * from its anchor (e.g. clearing z-fighting on a flush surface) without
 * duplicating the anchor's own coordinates at every call site. */
function offset(anchor: ShapeAnchor, dx = 0, dy = 0, dz = 0): [number, number, number] {
  return [anchor.position[0] + dx, anchor.position[1] + dy, anchor.position[2] + dz];
}

const DEFAULT_SCALE: [number, number, number] = [1, 1, 1];

// The "happy" eyes/mouth use wide, flat torus-arc geometry -- unlike the
// small round eye/mouth used everywhere else, a flat ring this wide doesn't
// self-clear a curved or tapered surface (cone, capsule) the way a rounded
// feature does: its outer edge sits well past where the single-point
// surface sample was taken, so the sample's small SURFACE_MARGIN isn't
// enough clearance and the ring's edges sink into the body mesh and get
// clipped. This extra push (empirically the smallest value that clears the
// cone's steep taper, the tightest case) keeps the whole ring in front of
// the surface on every shape.
const HAPPY_ARC_CLEARANCE = 0.035;

interface AvatarModelProps {
  config: AvatarConfiguration;
  animationState?: AnimationState;
  username?: string;
  showLabel?: boolean;
  /** Enables idle/walk bob + limb-swing animation. Disable for static previews. */
  animate?: boolean;
  /** Dev-only: renders small colored dots at every limb/face anchor so limb
   * placement can be visually verified per shape. Always off in normal use. */
  debugAnchors?: boolean;
}

/**
 * A geometric shape-character avatar: one dominant body-shape mesh (the
 * character's whole silhouette -- see game/avatar/shapes/) with generic,
 * shape-agnostic parts (face, stub limbs, head decoration, accessories)
 * attached at that shape's named anchors. Swapping `config.bodyShape` swaps
 * the dominant mesh and every anchor at once; no other code needs to change
 * per-shape. No external models or third-party assets are used.
 */
export function AvatarModel({
  config,
  animationState = "idle",
  username,
  showLabel = false,
  animate = true,
  debugAnchors = false,
}: AvatarModelProps) {
  const group = useRef<THREE.Group>(null);
  const bodyMesh = useRef<THREE.Mesh>(null);
  const legLeft = useRef<THREE.Group>(null);
  const legRight = useRef<THREE.Group>(null);
  const bob = useRef(0);

  const shape = bodyShapes[config.bodyShape] ?? bodyShapes["rounded-cube"];
  const { anchors } = shape;

  const bodyHex = hexFor(BODY_COLOR_OPTIONS, config.skinTone, "#ffc857");
  const decorationHex = hexFor(HAIR_COLOR_OPTIONS, config.hairColor, "#7a4a2b");
  const feetHex = hexFor(SHOES_OPTIONS, config.shoes, "#f2ede3");

  // Soft vinyl/clay toy finish -- see game/avatar/materials.ts for the
  // shared config every avatar (editor, headshot, multiplayer, museum)
  // draws from. Body and legs both go through getBodyMaterial() so they're
  // guaranteed the same physical response and only ever differ by color
  // (body color vs. shoe color); face features and the eye catchlight are
  // fixed singletons since their color/finish never varies by config.
  const materials = useMemo(
    () => ({
      body: getBodyMaterial(bodyHex),
      decoration: getHairMaterial(decorationHex),
      feet: getBodyMaterial(feetHex),
      eye: eyeMaterial,
      eyeHighlight: eyeHighlightMaterial,
      mouth: faceFeatureMaterial,
      glasses: getAccessoryMaterial("#3a332e"),
      sproutStem: getHairMaterial("#5a8a52"),
      // Dev-only high-contrast limb material, used only when debugAnchors
      // is on -- makes the leg's actual silhouette visible against the body
      // regardless of color-matching, for tuning position/scale.
      debugLeg: new THREE.MeshBasicMaterial({ color: "#ef4444" }),
    }),
    [bodyHex, decorationHex, feetHex]
  );

  const glassesLensGeometry =
    config.accessory === "square-glasses" ? avatarGeometry.glassesSquare : avatarGeometry.glassesRing;

  // Each limb's authored static tilt (its shape-specific rest pose) lives on
  // the X axis alongside the animated swing -- captured here so the swing
  // can be *added* to it every frame instead of overwriting it, which would
  // otherwise erase the rest-pose tilt the instant animation started.
  const legLeftBaseX = anchors.legLeft.rotation?.[0] ?? 0;
  const legRightBaseX = anchors.legRight.rotation?.[0] ?? 0;

  useFrame((state, delta) => {
    if (!animate || !group.current) return;
    const walking = animationState === "walking";
    const speed = walking ? 9 : 2.4;
    const bounceAmp = walking ? 0.045 : 0.02;
    bob.current += delta * speed;
    const bounce = Math.sin(bob.current) * bounceAmp;
    group.current.position.y = bounce;
    group.current.rotation.z = walking ? Math.sin(bob.current * 1.4) * 0.018 : 0;

    // Restrained, toy-like limb swing -- a much smaller idle sway so the
    // character never looks fully static.
    const limbSwingAmp = walking ? 0.24 : 0.03;
    const legSwing = Math.sin(bob.current) * limbSwingAmp;
    if (legLeft.current) legLeft.current.rotation.x = legLeftBaseX + legSwing;
    if (legRight.current) legRight.current.rotation.x = legRightBaseX - legSwing;

    // A light squash/stretch on the body itself reads as a toy-like bounce
    // rather than a rigid bob, kept subtle so it never looks rubbery.
    if (bodyMesh.current) {
      const squash = walking ? Math.sin(bob.current * 2) * 0.02 : Math.sin(bob.current) * 0.008;
      bodyMesh.current.scale.set(1 + squash, 1 - squash * 1.3, 1 + squash);
    }
  });

  return (
    <group>
      <group ref={group} position={[0, 0, 0]}>
        <group position={[0, shape.groundOffset, 0]}>
          {/* The dominant body shape -- the character itself. */}
          <mesh ref={bodyMesh} geometry={shape.geometry} material={materials.body} />

          {/* Legs -- short stub capsules swinging from a pivot at the body's
              underside. The mesh is offset by exactly its own (scaled) half
              height so its TOP sits at the pivot -- the leg hangs from where
              it attaches, so the walk swing rotates around that attachment
              point rather than the leg's own center. */}
          <group ref={legLeft} position={anchors.legLeft.position} rotation={anchors.legLeft.rotation}>
            <mesh
              geometry={avatarGeometry.limbLeg}
              material={debugAnchors ? materials.debugLeg : materials.feet}
              scale={anchors.legLeft.scale ?? DEFAULT_SCALE}
              position={[0, -LIMB_HALF_HEIGHT.leg * (anchors.legLeft.scale?.[1] ?? 1), 0]}
            />
          </group>
          <group ref={legRight} position={anchors.legRight.position} rotation={anchors.legRight.rotation}>
            <mesh
              geometry={avatarGeometry.limbLeg}
              material={debugAnchors ? materials.debugLeg : materials.feet}
              scale={anchors.legRight.scale ?? DEFAULT_SCALE}
              position={[0, -LIMB_HALF_HEIGHT.leg * (anchors.legRight.scale?.[1] ?? 1), 0]}
            />
          </group>

          {debugAnchors && (
            <group>
              {(
                [
                  ["face", "#22c55e"],
                  ["eyeLeft", "#16a34a"],
                  ["eyeRight", "#16a34a"],
                  ["mouth", "#065f46"],
                  ["faceAccessory", "#a3e635"],
                  ["headDecoration", "#eab308"],
                  ["legLeft", "#ef4444"],
                  ["legRight", "#ef4444"],
                ] as const
              ).map(([key, color]) => (
                <mesh key={key} position={anchors[key].position}>
                  <sphereGeometry args={[0.025, 8, 8]} />
                  <meshBasicMaterial color={color} depthTest={false} />
                </mesh>
              ))}
            </group>
          )}

          {/* Face -- extremely simple and expressive: small eyes and a tiny
              mouth, swapped per `config.expression`. Each feature uses its own
              independently-sampled anchor (not an offset from a single
              `face` point) so it sits flush with the *actual* surface at its
              own height, which can differ meaningfully from the eye-level
              surface on a curved or tapered shape -- brows/mouth variants
              below are all positioned relative to those same anchors via
              `offset()`, so they inherit the correct surface depth too. */}
          {config.expression === "happy" ? (
            <>
              <mesh
                geometry={avatarGeometry.eyeHappyArc}
                material={materials.eye}
                position={offset(anchors.eyeLeft, 0, 0, HAPPY_ARC_CLEARANCE)}
                rotation={[0, 0, Math.PI]}
              />
              <mesh
                geometry={avatarGeometry.eyeHappyArc}
                material={materials.eye}
                position={offset(anchors.eyeRight, 0, 0, HAPPY_ARC_CLEARANCE)}
                rotation={[0, 0, Math.PI]}
              />
            </>
          ) : (
            <>
              <mesh
                geometry={avatarGeometry.eye}
                material={materials.eye}
                position={anchors.eyeLeft.position}
                scale={
                  config.expression === "excited"
                    ? [1.3, 1.3, 0.75]
                    : config.expression === "mad"
                      ? [1, 0.6, 0.55]
                      : config.expression === "sad"
                        ? [0.9, 0.8, 0.55]
                        : [1, 1, 0.6]
                }
              />
              <mesh
                geometry={avatarGeometry.eye}
                material={materials.eye}
                position={anchors.eyeRight.position}
                scale={
                  config.expression === "excited"
                    ? [1.3, 1.3, 0.75]
                    : config.expression === "mad"
                      ? [1, 0.6, 0.55]
                      : config.expression === "sad"
                        ? [0.9, 0.8, 0.55]
                        : [1, 1, 0.6]
                }
              />
              <mesh
                geometry={avatarGeometry.eyeHighlight}
                material={materials.eyeHighlight}
                position={offset(anchors.eyeLeft, -0.025, 0.025, 0.02)}
                scale={config.expression === "excited" ? 1.3 : 1}
              />
              <mesh
                geometry={avatarGeometry.eyeHighlight}
                material={materials.eyeHighlight}
                position={offset(anchors.eyeRight, -0.025, 0.025, 0.02)}
                scale={config.expression === "excited" ? 1.3 : 1}
              />
            </>
          )}

          {/* Eyebrows -- only sad/mad/confused have them; the other
              expressions read clearly from eyes + mouth alone. */}
          {config.expression === "sad" && (
            <>
              <mesh
                geometry={avatarGeometry.browBar}
                material={materials.mouth}
                position={offset(anchors.eyeLeft, 0, 0.078, 0.012)}
                rotation={[0, 0, Math.PI / 2 + 0.32]}
              />
              <mesh
                geometry={avatarGeometry.browBar}
                material={materials.mouth}
                position={offset(anchors.eyeRight, 0, 0.078, 0.012)}
                rotation={[0, 0, Math.PI / 2 - 0.32]}
              />
            </>
          )}
          {config.expression === "mad" && (
            <>
              <mesh
                geometry={avatarGeometry.browBar}
                material={materials.mouth}
                position={offset(anchors.eyeLeft, 0, 0.075, 0.012)}
                rotation={[0, 0, Math.PI / 2 - 0.32]}
              />
              <mesh
                geometry={avatarGeometry.browBar}
                material={materials.mouth}
                position={offset(anchors.eyeRight, 0, 0.075, 0.012)}
                rotation={[0, 0, Math.PI / 2 + 0.32]}
              />
            </>
          )}
          {config.expression === "confused" && (
            <mesh
              geometry={avatarGeometry.browBar}
              material={materials.mouth}
              position={offset(anchors.eyeRight, 0, 0.07, 0.012)}
              rotation={[0, 0, Math.PI / 2 + 0.4]}
            />
          )}

          {/* Mouth -- smile (standard/happy, bigger for happy), frown
              (sad/mad, tighter for mad), a small flat unsure line
              (confused), or an open oval (excited). */}
          {config.expression === "confused" ? (
            <mesh
              geometry={avatarGeometry.browBar}
              material={materials.mouth}
              position={anchors.mouth.position}
              rotation={[0, 0, Math.PI / 2 + 0.22]}
            />
          ) : config.expression === "excited" ? (
            <mesh
              geometry={avatarGeometry.mouthOpen}
              material={materials.mouth}
              position={anchors.mouth.position}
              scale={[1, 1.3, 0.6]}
            />
          ) : (
            <mesh
              geometry={avatarGeometry.mouth}
              material={materials.mouth}
              position={
                config.expression === "happy"
                  ? offset(anchors.mouth, 0, 0, HAPPY_ARC_CLEARANCE)
                  : anchors.mouth.position
              }
              rotation={config.expression === "sad" || config.expression === "mad" ? [0, 0, 0] : [0, 0, Math.PI]}
              scale={
                config.expression === "happy" ? [1.5, 1.5, 1.3] : config.expression === "mad" ? [0.85, 0.85, 1] : [1, 1, 1]
              }
            />
          )}

          {/* Head decoration -- sprout / top-hat / spiky-hair / none. */}
          {config.hairStyle === "sprout" && (
            <group position={anchors.headDecoration.position}>
              <mesh geometry={avatarGeometry.sproutStem} material={materials.sproutStem} position={[0, 0.06, 0]} />
              <mesh
                geometry={avatarGeometry.sproutLeaf}
                material={materials.decoration}
                position={[-0.045, 0.13, 0]}
                scale={[1.3, 0.5, 0.7]}
                rotation={[0, 0, 0.5]}
              />
              <mesh
                geometry={avatarGeometry.sproutLeaf}
                material={materials.decoration}
                position={[0.045, 0.15, 0]}
                scale={[1.3, 0.5, 0.7]}
                rotation={[0, 0, -0.5]}
              />
            </group>
          )}
          {config.hairStyle === "top-hat" && (
            <group position={anchors.headDecoration.position}>
              <mesh geometry={avatarGeometry.topHatBrim} material={materials.decoration} position={[0, 0.015, 0]} />
              <mesh geometry={avatarGeometry.topHatCrown} material={materials.decoration} position={[0, 0.1225, 0]} />
            </group>
          )}
          {config.hairStyle === "spiky-hair" && (
            <group position={anchors.headDecoration.position}>
              <mesh geometry={avatarGeometry.spike} material={materials.decoration} position={[0, 0.07, 0]} />
              <mesh
                geometry={avatarGeometry.spike}
                material={materials.decoration}
                position={[-0.05, 0.055, 0.01]}
                rotation={[0, 0, 0.4]}
              />
              <mesh
                geometry={avatarGeometry.spike}
                material={materials.decoration}
                position={[0.05, 0.055, 0.01]}
                rotation={[0, 0, -0.4]}
              />
              <mesh
                geometry={avatarGeometry.spike}
                material={materials.decoration}
                position={[-0.025, 0.06, -0.045]}
                rotation={[-0.35, 0, 0.15]}
              />
              <mesh
                geometry={avatarGeometry.spike}
                material={materials.decoration}
                position={[0.025, 0.06, -0.045]}
                rotation={[-0.35, 0, -0.15]}
              />
            </group>
          )}

          {/* Glasses accessory -- lens shape (round/square) picked via
              glassesLensGeometry, same frame composition for every style. */}
          {config.accessory !== "none" && (
            <group position={anchors.faceAccessory.position}>
              <mesh geometry={glassesLensGeometry} material={materials.glasses} position={[-0.115, 0.05, 0]} />
              <mesh geometry={glassesLensGeometry} material={materials.glasses} position={[0.115, 0.05, 0]} />
              <mesh
                geometry={avatarGeometry.glassesBridge}
                material={materials.glasses}
                position={[0, 0.05, 0]}
                rotation={[0, 0, Math.PI / 2]}
              />
            </group>
          )}
        </group>
      </group>
      {showLabel && username && (
        // Billboard keeps the nameplate readable and camera-facing regardless
        // of which way the avatar itself is turned.
        <Billboard position={[0, shape.approxHeight + 0.35, 0]}>
          <Text
            fontSize={0.16}
            color="#3c2e28"
            outlineWidth={0.012}
            outlineColor="#faf7f2"
            anchorX="center"
            anchorY="bottom"
          >
            {username}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
