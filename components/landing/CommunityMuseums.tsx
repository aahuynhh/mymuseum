import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionEnvironment } from "@/components/ui/SectionEnvironment";
import { ExhibitionWallPiece } from "@/components/landing/ExhibitionWallPiece";
import { SectionIntro } from "@/components/landing/SectionIntro";
import { GroupIcon } from "@/components/ui/PageIcons";
import { getPublishedMuseumSummaries } from "@/server/museumsRepository";

const PREVIEW_COUNT = 3;

/**
 * Replaces the old single-artist "Featured Artist" section -- the homepage
 * should read as a platform other people are actually building on, not one
 * person's portfolio, so this pulls real published museums (same query
 * /explore uses) instead of a hardcoded profile. No live-visitor peeking
 * here: it's a marketing preview, not the discovery page, so it stays a
 * plain server-rendered slice with no client socket connection.
 *
 * Rendered as an actual gallery wall, not a card grid: ExhibitionWallPiece
 * mounts each museum as a framed image + placard directly on the deep-blue
 * wall, with generous, slightly staggered spacing instead of a dense
 * equal-width grid. No bottomBoundary here -- FinalCta's gold trim strip is
 * this wall's baseboard, marking where it meets the floor below. This
 * section's own copy is authored in text-surface rather than the
 * light-mode ink tokens SectionEnvironment uses elsewhere.
 */
export async function CommunityMuseums() {
  const museums = await getPublishedMuseumSummaries();
  const preview = museums.slice(0, PREVIEW_COUNT);

  return (
    <SectionEnvironment tone="deep" className="py-16 sm:py-24">
      <ScrollReveal>
        <SectionIntro
          icon={<GroupIcon />}
          accent="sage"
          dark
          title="Museums people are building"
          actions={
            preview.length > 0 && (
              <LinkButton
                href="/explore"
                variant="secondary"
                className="!border-surface/30 !bg-transparent !text-surface hover:!border-surface hover:!bg-surface/10 hover:!text-surface"
              >
                View all museums
              </LinkButton>
            )
          }
        />

        {preview.length > 0 ? (
          <ul className="mt-14 flex flex-wrap justify-center gap-x-14 gap-y-16 sm:justify-between">
            {preview.map((museum, index) => (
              <ExhibitionWallPiece key={museum.id} museum={museum} index={index} />
            ))}
          </ul>
        ) : (
          <EmptyState
            tone="dark"
            className="mt-10"
            title="No museums published yet"
            description="Be the first to publish one -- it'll show up here and on the explore page for everyone to visit."
            actions={
              <LinkButton href="/create" variant="secondary" size="lg">
                Create your museum
              </LinkButton>
            }
          />
        )}
      </ScrollReveal>
    </SectionEnvironment>
  );
}
