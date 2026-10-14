/**
 * Field names below (`skinTone`, `hairStyle`, `top`, `bottom`, `shoes`) are
 * kept stable even though their visual meaning has been redesigned around
 * geometric shape-characters -- this is the same JSON shape already
 * persisted in localStorage (guests) and Supabase (`profiles.avatar_configuration`),
 * so keeping the keys avoids a data migration for the parts of the shape
 * that didn't need to change. The *values* and on-screen labels are new:
 *   skinTone  -> "body color", a playful saturated palette (not skin tones)
 *   hairStyle -> "head decoration" (sprouts/hats/spikes -- not human hair)
 *   shoes     -> feet / leg-tip color
 * `top` and `bottom` (previously accent-color patches on the body) are no
 * longer rendered -- kept here only so already-persisted configs still
 * validate, not shown in either avatar editor.
 */
export type BodyShape = "rounded-cube" | "cone" | "capsule";

export type BodyColor =
  | "coral"
  | "citrus"
  | "sage"
  | "sky"
  | "plum"
  | "mint"
  | "blush"
  | "teal"
  | "charcoal";
export type HeadDecoration = "sprout" | "top-hat" | "spiky-hair" | "none";
export type HairColor = "charcoal" | "chestnut" | "flax" | "berry" | "cream" | "rose";
export type Top = "sunset-sweater" | "linen-shirt" | "overall-set";
export type Bottom = "wide-trousers" | "denim-skirt" | "canvas-shorts";
export type Shoes = "canvas-sneakers" | "gallery-loafers" | "garden-boots";
export type Accessory = "round-glasses" | "square-glasses" | "none";
export type Expression = "standard" | "happy" | "sad" | "mad" | "confused" | "excited";

export interface AvatarConfiguration {
  bodyShape: BodyShape;
  skinTone: BodyColor;
  hairStyle: HeadDecoration;
  hairColor: HairColor;
  top: Top;
  bottom: Bottom;
  shoes: Shoes;
  accessory: Accessory;
  expression: Expression;
}

export const BODY_SHAPE_OPTIONS: { value: BodyShape; label: string }[] = [
  { value: "rounded-cube", label: "Rounded Cube" },
  { value: "cone", label: "Cone" },
  { value: "capsule", label: "Capsule" },
];

export const BODY_COLOR_OPTIONS: { value: BodyColor; hex: string; label: string }[] = [
  { value: "coral", hex: "#ff8a68", label: "Coral" },
  { value: "citrus", hex: "#ffc857", label: "Citrus" },
  { value: "sage", hex: "#8fbf8a", label: "Sage" },
  { value: "sky", hex: "#6fb8e0", label: "Sky" },
  { value: "plum", hex: "#b48adf", label: "Plum" },
  { value: "mint", hex: "#7dd8b6", label: "Mint" },
  { value: "blush", hex: "#ff9fb2", label: "Blush" },
  { value: "teal", hex: "#4fb3a9", label: "Teal" },
  { value: "charcoal", hex: "#6b6f76", label: "Charcoal" },
];

export const HEAD_DECORATION_OPTIONS: { value: HeadDecoration; label: string }[] = [
  { value: "sprout", label: "Sprout" },
  { value: "top-hat", label: "Top Hat" },
  { value: "spiky-hair", label: "Spiky Hair" },
  { value: "none", label: "None" },
];

export const HAIR_COLOR_OPTIONS: { value: HairColor; hex: string; label: string }[] = [
  { value: "charcoal", hex: "#3a332e", label: "Charcoal" },
  { value: "chestnut", hex: "#7a4a2b", label: "Chestnut" },
  { value: "flax", hex: "#e8c468", label: "Flax" },
  { value: "berry", hex: "#8a3b5a", label: "Berry" },
  { value: "cream", hex: "#f5ead0", label: "Cream" },
  { value: "rose", hex: "#e08bb0", label: "Rose" },
];

export const TOP_OPTIONS: { value: Top; hex: string; label: string }[] = [
  { value: "sunset-sweater", hex: "#e07a5f", label: "Sunset" },
  { value: "linen-shirt", hex: "#e8dfce", label: "Linen" },
  { value: "overall-set", hex: "#4f7a6b", label: "Meadow" },
];

export const BOTTOM_OPTIONS: { value: Bottom; hex: string; label: string }[] = [
  { value: "wide-trousers", hex: "#3d5a6c", label: "Harbor" },
  { value: "denim-skirt", hex: "#5b7fa6", label: "Denim" },
  { value: "canvas-shorts", hex: "#c9b896", label: "Canvas" },
];

export const SHOES_OPTIONS: { value: Shoes; hex: string; label: string }[] = [
  { value: "canvas-sneakers", hex: "#f2ede3", label: "Canvas" },
  { value: "gallery-loafers", hex: "#6b4a3a", label: "Umber" },
  { value: "garden-boots", hex: "#8a6f47", label: "Moss" },
];

export const ACCESSORY_OPTIONS: { value: Accessory; label: string }[] = [
  { value: "round-glasses", label: "Round Glasses" },
  { value: "square-glasses", label: "Square Glasses" },
  { value: "none", label: "None" },
];

export const EXPRESSION_OPTIONS: { value: Expression; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "happy", label: "Happy" },
  { value: "sad", label: "Sad" },
  { value: "mad", label: "Mad" },
  { value: "confused", label: "Confused" },
  { value: "excited", label: "Excited" },
];

export const DEFAULT_AVATAR_CONFIGURATION: AvatarConfiguration = {
  bodyShape: "rounded-cube",
  skinTone: "citrus",
  hairStyle: "sprout",
  hairColor: "chestnut",
  top: "sunset-sweater",
  bottom: "wide-trousers",
  shoes: "canvas-sneakers",
  accessory: "round-glasses",
  expression: "standard",
};
