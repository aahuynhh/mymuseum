"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";

const TABS = [
  { href: "/explore", label: "Museums" },
  { href: "/explore/artists", label: "Artists" },
];

/** Museums/Artists switch for the Explore section -- lives inside the
 * section instead of the top nav so the persistent header stays lean (see
 * SiteHeader's single "Explore" link). */
export function ExploreTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-10 inline-flex items-center gap-1 rounded-full border border-border/70 bg-surface p-1 shadow-warm-xs">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200",
              active ? "bg-gallery-blue text-surface" : "text-ink-muted hover:text-ink"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
