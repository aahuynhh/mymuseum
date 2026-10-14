"use client";

import { useEffect, useState } from "react";

function readPreference() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/** True for touch-primary devices (phones/tablets without a mouse/trackpad)
 * -- used to default new visitors into the accessible grid view instead of
 * the 3D room, which has no on-screen touch controls yet (see
 * PlayerController), and to hide the keyboard-only controls legend in the
 * museum's Controls popover. Mirrors usePrefersReducedMotion's pattern. */
export function usePrefersCoarsePointer() {
  const [coarsePointer, setCoarsePointer] = useState(readPreference);

  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const handler = (event: MediaQueryListEvent) => setCoarsePointer(event.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  return coarsePointer;
}
