"use client";

import dynamic from "next/dynamic";
import { MuseumLoadingScreen } from "./MuseumLoadingScreen";

// next/dynamic with ssr:false must be called from a Client Component, so
// this thin wrapper is what the (Server Component) museum route imports.
export const MuseumExperienceLoader = dynamic(
  () => import("./MuseumExperience").then((m) => m.MuseumExperience),
  { ssr: false, loading: () => <MuseumLoadingScreen /> }
);
