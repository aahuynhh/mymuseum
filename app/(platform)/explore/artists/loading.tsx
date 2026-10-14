import { PageHeader } from "@/components/ui/PageHeader";
import { PersonIcon } from "@/components/ui/PageIcons";
import { ExploreTabs } from "@/components/explore/ExploreTabs";
import { CreatorGridSkeleton } from "@/components/explore/ExploreCardSkeleton";

/** Instant pending UI for /explore/artists -- see app/(platform)/explore/loading.tsx
 * for why this exists. Overrides that parent boundary with artist-shaped
 * placeholders instead of museum-shaped ones. */
export default function Loading() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
      <PageHeader
        icon={<PersonIcon />}
        accent="berry"
        title="Explore artists"
        description="Creators publishing museums on MyMuseum."
      />
      <ExploreTabs />
      <CreatorGridSkeleton />
    </main>
  );
}
