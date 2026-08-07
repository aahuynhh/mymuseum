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
}

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
    wallColor: "#f2e8d8",
    trimColor: "#b8916a",
    railColor: "#c9a67c",
    floorColor: "#dcc19a",
    accentLight: "#ffdfa8",
    skylight: "#fff3dc",
  },
  "museum-blue": {
    id: "museum-blue",
    label: "Museum Blue",
    wallColor: "#2f4258",
    trimColor: "#c9a267",
    railColor: "#d9b87e",
    floorColor: "#8a5a3a",
    accentLight: "#ffe4b0",
    skylight: "#eadfc4",
  },
  sage: {
    id: "sage",
    label: "Muted Sage",
    wallColor: "#8a9678",
    trimColor: "#5c6349",
    railColor: "#c9c2a3",
    floorColor: "#c7ac82",
    accentLight: "#fff0d2",
    skylight: "#f2edda",
  },
  terracotta: {
    id: "terracotta",
    label: "Dusty Terracotta",
    wallColor: "#a86b52",
    trimColor: "#5a3826",
    railColor: "#e3c49a",
    floorColor: "#7a5236",
    accentLight: "#ffdcae",
    skylight: "#f6e3c8",
  },
  charcoal: {
    id: "charcoal",
    label: "Charcoal Accent",
    wallColor: "#3a352f",
    trimColor: "#8a6f47",
    railColor: "#b89a68",
    floorColor: "#4a3f34",
    accentLight: "#ffd9a0",
    skylight: "#e8ddc4",
  },
};

export const GALLERY_THEME_LIST = Object.values(GALLERY_THEMES);

export function getGalleryTheme(id: GalleryThemeId): GalleryTheme {
  return GALLERY_THEMES[id];
}
