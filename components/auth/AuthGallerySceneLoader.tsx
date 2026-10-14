"use client";

import dynamic from "next/dynamic";
import { AuthGallerySceneSkeleton } from "./AuthGallerySceneSkeleton";

// next/dynamic with ssr:false must be called from a Client Component, so
// this thin wrapper is what the (Server Component) auth pages import.
export const AuthGallerySceneLoader = dynamic(
  () => import("./AuthGalleryScene").then((m) => m.AuthGalleryScene),
  { ssr: false, loading: () => <AuthGallerySceneSkeleton /> }
);
