"use client";

import dynamic from "next/dynamic";

// next/dynamic with ssr:false must be called from a Client Component, so
// this thin wrapper is what the (Server Component) profile page imports.
export const ProfileAvatarPreviewLoader = dynamic(
  () => import("./ProfileAvatarPreview").then((m) => m.ProfileAvatarPreview),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square w-28 shrink-0 animate-pulse rounded-3xl bg-canvas-deep sm:w-36" />
    ),
  }
);
