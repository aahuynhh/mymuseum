export type SkinTone = "porcelain" | "honey" | "almond" | "sienna" | "cocoa";
export type HairStyle = "curly-bob" | "swoop" | "twin-buns";
export type HairColor = "charcoal" | "chestnut" | "flax" | "berry";
export type Top = "sunset-sweater" | "linen-shirt" | "overall-set";
export type Bottom = "wide-trousers" | "denim-skirt" | "canvas-shorts";
export type Shoes = "canvas-sneakers" | "gallery-loafers" | "garden-boots";
export type Accessory = "round-glasses" | "beret" | "tote-bag" | "none";

export interface AvatarConfiguration {
  skinTone: SkinTone;
  hairStyle: HairStyle;
  hairColor: HairColor;
  top: Top;
  bottom: Bottom;
  shoes: Shoes;
  accessory: Accessory;
}

export const SKIN_TONE_OPTIONS: { value: SkinTone; hex: string; label: string }[] = [
  { value: "porcelain", hex: "#f4d9c6", label: "Porcelain" },
  { value: "honey", hex: "#e8b98d", label: "Honey" },
  { value: "almond", hex: "#c98a5e", label: "Almond" },
  { value: "sienna", hex: "#a86642", label: "Sienna" },
  { value: "cocoa", hex: "#6f4530", label: "Cocoa" },
];

export const HAIR_STYLE_OPTIONS: { value: HairStyle; label: string }[] = [
  { value: "curly-bob", label: "Curly Bob" },
  { value: "swoop", label: "Swoop" },
  { value: "twin-buns", label: "Twin Buns" },
];

export const HAIR_COLOR_OPTIONS: { value: HairColor; hex: string; label: string }[] = [
  { value: "charcoal", hex: "#3a332e", label: "Charcoal" },
  { value: "chestnut", hex: "#7a4a2b", label: "Chestnut" },
  { value: "flax", hex: "#e8c468", label: "Flax" },
  { value: "berry", hex: "#8a3b5a", label: "Berry" },
];

export const TOP_OPTIONS: { value: Top; hex: string; label: string }[] = [
  { value: "sunset-sweater", hex: "#e07a5f", label: "Sunset Sweater" },
  { value: "linen-shirt", hex: "#e8dfce", label: "Linen Shirt" },
  { value: "overall-set", hex: "#4f7a6b", label: "Overall Set" },
];

export const BOTTOM_OPTIONS: { value: Bottom; hex: string; label: string }[] = [
  { value: "wide-trousers", hex: "#3d5a6c", label: "Wide Trousers" },
  { value: "denim-skirt", hex: "#5b7fa6", label: "Denim Skirt" },
  { value: "canvas-shorts", hex: "#c9b896", label: "Canvas Shorts" },
];

export const SHOES_OPTIONS: { value: Shoes; hex: string; label: string }[] = [
  { value: "canvas-sneakers", hex: "#f2ede3", label: "Canvas Sneakers" },
  { value: "gallery-loafers", hex: "#6b4a3a", label: "Gallery Loafers" },
  { value: "garden-boots", hex: "#8a6f47", label: "Garden Boots" },
];

export const ACCESSORY_OPTIONS: { value: Accessory; label: string }[] = [
  { value: "round-glasses", label: "Round Glasses" },
  { value: "beret", label: "Beret" },
  { value: "tote-bag", label: "Tote Bag" },
  { value: "none", label: "None" },
];

export const DEFAULT_AVATAR_CONFIGURATION: AvatarConfiguration = {
  skinTone: "honey",
  hairStyle: "curly-bob",
  hairColor: "chestnut",
  top: "sunset-sweater",
  bottom: "wide-trousers",
  shoes: "canvas-sneakers",
  accessory: "round-glasses",
};
