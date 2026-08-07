"use client";

import dynamic from "next/dynamic";
import { Hero3DPreviewSkeleton } from "./Hero3DPreviewSkeleton";

// next/dynamic with ssr:false must be called from a Client Component, so
// this thin wrapper is what Server Components (like the landing page) import.
export const Hero3DPreviewLoader = dynamic(
  () => import("./Hero3DPreview").then((m) => m.Hero3DPreview),
  { ssr: false, loading: () => <Hero3DPreviewSkeleton /> }
);
