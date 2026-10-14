export type PageAccent = "terracotta" | "blue" | "dustyBlue" | "sage" | "berry" | "gold";

/**
 * Fill color for the icon tile in PageHeader/AuthGate, one per page family.
 * Picked from the existing `-dark` end of each pair so a white icon always
 * sits on a solid, high-contrast tile regardless of accent.
 */
export const PAGE_ACCENT_BG: Record<PageAccent, string> = {
  terracotta: "bg-terracotta-dark",
  blue: "bg-gallery-blue",
  dustyBlue: "bg-dusty-blue-dark",
  sage: "bg-sage-dark",
  berry: "bg-berry",
  gold: "bg-antique-gold-dark",
};
