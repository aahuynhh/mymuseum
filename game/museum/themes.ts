export type GalleryThemeId = "linen" | "museum-blue" | "sage" | "terracotta" | "charcoal";

export interface GalleryTheme {
  id: GalleryThemeId;
  label: string;
  /** Main wall color */
  wallColor: string;
  /** Baseboard / door frame trim */
  trimColor: string;
  /** Picture-rail molding line */
  railColor: string;
  /** Floor plank base tone for this room */
  floorColor: string;
  /** Warm accent light color for this room's spotlights */
  accentLight: string;
  /** Ambient skylight tint */
  skylight: string;
  /** Photographed wall material (CC0, public/textures/walls), shared by
   * every theme and tinted by `wallColor` -- one real physical surface
   * (white stucco) doing double duty as both a texture and a customizable
   * color, rather than a flat color with no surface detail. */
  wallTexture: string;
}

const WALL_TEXTURE = "/textures/walls/stucco-white.png";

/**
 * Five warm, sophisticated room palettes -- kept deliberately restrained
 * (no bright/saturated hues) so the artwork stays the most colorful thing
 * in any given gallery. Museums feel curated when each room has its own
 * mood rather than one repeated palette everywhere.
 */
export const GALLERY_THEMES: Record<GalleryThemeId, GalleryTheme> = {
  linen: {
    id: "linen",
    label: "Warm Cream",
    wallColor: "#f5ecdc",
    trimColor: "#b3915e",
    railColor: "#c9a67c",
    floorColor: "#ebdec4",
    accentLight: "#ffdfa8",
    skylight: "#fff3dc",
    wallTexture: WALL_TEXTURE,
  },
  "museum-blue": {
    id: "museum-blue",
    label: "Museum Blue",
    wallColor: "#1f3f5c",
    trimColor: "#b8905a",
    railColor: "#cda870",
    floorColor: "#d4cbb6",
    accentLight: "#ffe4b0",
    skylight: "#eadfc4",
    wallTexture: WALL_TEXTURE,
  },
  sage: {
    id: "sage",
    label: "Muted Sage",
    wallColor: "#8a9678",
    trimColor: "#5c6349",
    railColor: "#c9c2a3",
    floorColor: "#decfaf",
    accentLight: "#fff0d2",
    skylight: "#f2edda",
    wallTexture: WALL_TEXTURE,
  },
  terracotta: {
    id: "terracotta",
    label: "Dusty Terracotta",
    wallColor: "#a86b52",
    trimColor: "#5a3826",
    railColor: "#e3c49a",
    floorColor: "#dec1a3",
    accentLight: "#ffdcae",
    skylight: "#f6e3c8",
    wallTexture: WALL_TEXTURE,
  },
  charcoal: {
    id: "charcoal",
    label: "Charcoal Accent",
    wallColor: "#3a352f",
    trimColor: "#8a6f47",
    railColor: "#b89a68",
    floorColor: "#bfb7ad",
    accentLight: "#ffd9a0",
    skylight: "#e8ddc4",
    wallTexture: WALL_TEXTURE,
  },
};

export const GALLERY_THEME_LIST = Object.values(GALLERY_THEMES);

export function getGalleryTheme(id: GalleryThemeId): GalleryTheme {
  return GALLERY_THEMES[id];
}
