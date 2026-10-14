"use client";

import dynamic from "next/dynamic";

// next/dynamic with ssr:false must be called from a Client Component, so
// this thin wrapper is what Server Components (like the landing page) import.
// No loading fallback here -- HomeLoadingGate already covers the entire
// page (this component's own JS-chunk-download stage included) with the
// site's loading screen, so this has nothing useful to show underneath it.
export const Hero3DPreviewLoader = dynamic(
  () => import("./Hero3DPreview").then((m) => m.Hero3DPreview),
  { ssr: false }
);
