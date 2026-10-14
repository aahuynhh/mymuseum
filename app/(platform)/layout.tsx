import { PlatformHud } from "@/components/platform/PlatformHud";

/**
 * Shared shell for every logged-in-feeling route (dashboard, explore,
 * create, avatar, artist profiles) -- the same game/app HUD the home page
 * uses. See components/platform/PlatformHud.tsx.
 */
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PlatformHud />
      {children}
    </>
  );
}
