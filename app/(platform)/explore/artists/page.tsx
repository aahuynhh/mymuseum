import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PersonIcon } from "@/components/ui/PageIcons";
import { ExploreTabs } from "@/components/explore/ExploreTabs";
import { CreatorCard } from "@/components/explore/CreatorCard";
import { getPublicCreators } from "@/server/creatorsRepository";

export const metadata: Metadata = {
  title: "Explore Artists",
  description: "Creators publishing museums on MyMuseum.",
};

export default async function ExploreArtistsPage() {
  const creators = await getPublicCreators();

  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
      <PageHeader
        icon={<PersonIcon />}
        accent="berry"
        title="Explore artists"
        description="Creators publishing museums on MyMuseum."
      />
      <ExploreTabs />

      {creators.length === 0 ? (
        <EmptyState
          title="No artists yet"
          description="Once someone publishes a museum, they'll show up here."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => (
            <CreatorCard key={creator.id} {...creator} />
          ))}
        </ul>
      )}
    </main>
  );
}
