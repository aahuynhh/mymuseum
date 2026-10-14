"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { PlatformHud } from "@/components/platform/PlatformHud";
import { Logo } from "@/components/ui/Logo";
import { Hero } from "./Hero";

// How long a visitor on a bad connection waits before seeing the page
// regardless of whether the hero's 3D scene has actually finished loading.
const READY_FAILSAFE_MS = 5000;

/**
 * Owns the homepage's first-paint loading state. The rest of the page --
 * PlatformHud's header/nav chrome included, not just the hero itself -- is
 * always mounted underneath (so the hero starts loading immediately rather
 * than waiting on an unmount/remount), but a full-page loading screen
 * (nothing but the site's own cream background and logo) covers all of it
 * until the hero is actually ready to look at. Without this, the header/nav
 * appeared instantly while the hero itself was still visibly loading in
 * behind it, which read as the page being half-broken rather than loading.
 *
 * "Ready" is whichever comes first: the hero's own onReady callback (fired
 * once every texture/model it needs has actually resolved, see
 * Hero3DPreview.tsx) or the failsafe timer below -- evaluated fresh on
 * every mount, reloads included. An earlier version of this short-circuited
 * straight to ready on a reload (via a sessionStorage "already seen"
 * flag), but a reload genuinely does have to reload the 3D scene's
 * textures/models from scratch -- skipping the loading screen there just
 * meant the header/nav appeared over a still-empty Canvas instead of over
 * nothing, which is the exact half-loaded look this gate exists to
 * prevent. So there's no persisted "seen" state anymore: every load waits
 * for the real thing.
 *
 * `children`/`footer` are rendered by app/page.tsx (a Server Component) and
 * passed in rather than imported here -- several of those sections
 * (CommunityMuseums, SiteFooter) are themselves Server Components that do
 * server-only data fetching, which can only be composed into a Client
 * Component's tree via children, never imported directly by one.
 */
export function HomeLoadingGate({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), READY_FAILSAFE_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleHeroReady = useCallback(() => setReady(true), []);

  return (
    <>
      <PlatformHud />
      <main id="main-content" className="flex-1">
        <Hero onReady={handleHeroReady} />
        {children}
      </main>
      {footer}
      {!ready && (
        <div aria-hidden="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-canvas">
          <Logo className="motion-safe:animate-pulse" />
        </div>
      )}
    </>
  );
}
