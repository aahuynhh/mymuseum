import { PageHeader } from "@/components/ui/PageHeader";
import { CompassIcon } from "@/components/ui/PageIcons";
import { ExploreTabs } from "@/components/explore/ExploreTabs";
import { MuseumGridSkeleton } from "@/components/explore/ExploreCardSkeleton";

/** Instant pending UI for /explore -- without this, clicking the HUD's
 * "Explore" link left the previous page frozen on screen until the museum
 * list finished fetching, which read as a stuck/laggy button. This mirrors
 * the real page's chrome exactly so the swap from skeleton to real cards is
 * seamless. */
export default function Loading() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
      <PageHeader
        icon={<CompassIcon />}
        accent="blue"
        title="Explore museums"
        description="Published museums from the MyMuseum community."
      />
      <ExploreTabs />
      <MuseumGridSkeleton />
    </main>
  );
}
