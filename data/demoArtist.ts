import type { AvatarConfiguration } from "@/types";

/** Avatar worn by the figure standing in the homepage's live 3D preview
 * (see components/landing/Hero3DPreview.tsx) -- a generic room occupant,
 * not tied to any named creator. */
export const DEMO_ARTIST_AVATAR: AvatarConfiguration = {
  bodyShape: "rounded-cube",
  skinTone: "plum",
  hairStyle: "top-hat",
  hairColor: "chestnut",
  top: "sunset-sweater",
  bottom: "denim-skirt",
  shoes: "garden-boots",
  accessory: "round-glasses",
  expression: "happy",
};
