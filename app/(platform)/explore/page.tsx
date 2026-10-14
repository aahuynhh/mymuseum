import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompassIcon } from "@/components/ui/PageIcons";
import { getPublishedMuseumSummaries } from "@/server/museumsRepository";
import { getDemoMuseumSummary } from "@/server/creatorsRepository";
import { ExploreSections } from "@/components/explore/ExploreSections";
import { ExploreTabs } from "@/components/explore/ExploreTabs";

export const metadata: Metadata = {
  title: "Explore",
  description: "Browse published museums from the MyMuseum community.",
};

export default async function ExplorePage() {
  const [publishedMuseums, demoMuseum] = await Promise.all([
    getPublishedMuseumSummaries(),
    getDemoMuseumSummary(),
  ]);
  // Artlane (data/museum.ts) is static seed data, not a `museums` table
  // row, so it isn't in publishedMuseums -- fold it in and re-sort so it
  // takes its natural place by date instead of pinning to one end.
  const museums = demoMuseum
    ? [demoMuseum, ...publishedMuseums].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : publishedMuseums;

  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
      <PageHeader
        icon={<CompassIcon />}
        accent="blue"
        title="Explore museums"
        description="Published museums from the MyMuseum community."
      />
      <ExploreTabs />

      {museums.length === 0 ? (
        <EmptyState
          title="No museums published yet"
          description="Once someone publishes a museum, it'll show up here for anyone to visit."
        />
      ) : (
        <ExploreSections museums={museums} />
      )}
    </main>
  );
}
