"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/ui/Logo";
import { AccountMenu } from "./AccountMenu";
import { CompassIcon, MuseumIcon, PlusIcon } from "@/components/ui/PageIcons";
import { cn } from "@/utils/cn";

const DOCK_LINKS = [
  { href: "/explore", label: "Explore", icon: CompassIcon },
  { href: "/dashboard", label: "My Museums", icon: MuseumIcon },
  { href: "/create", label: "Create", icon: PlusIcon },
];

/**
 * The lightweight game/app HUD used across the whole site (home, dashboard,
 * explore, create, avatar, artist profiles). It's three fixed, corner-
 * anchored controls rather than one bar, so the page underneath can stay
 * nearly full-bleed -- see app/(platform)/layout.tsx and app/page.tsx for
 * where this mounts.
 */
export function PlatformHud() {
  const pathname = usePathname();

  return (
    <>
      <Link
        href="/"
        aria-label="MyMuseum home"
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-surface/95 shadow-warm-sm backdrop-blur-md transition-shadow duration-200 hover:shadow-warm-md sm:left-6 sm:top-6"
      >
        <LogoMark className="h-6 w-auto" />
      </Link>

      <AccountMenu />

      {/* `pointer-events-none` on the full-width wrapper keeps it from
          intercepting clicks/taps across the whole bottom edge of every
          page (e.g. swallowing a button that happens to render at the same
          height); only the pill cluster itself opts back in. */}
      <nav
        aria-label="Platform"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:bottom-6"
      >
        <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-border/70 bg-surface/95 p-1 shadow-warm-md backdrop-blur-md">
          {DOCK_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 font-heading text-sm font-medium transition-colors duration-200",
                  active ? "tile-bevel bg-gallery-blue text-surface" : "text-ink-muted hover:text-ink"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
