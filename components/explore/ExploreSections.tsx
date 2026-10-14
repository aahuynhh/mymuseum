"use client";

import { useMemo } from "react";
import { useVisitorCountsPeek } from "@/hooks/useVisitorCountsPeek";
import { ExploreMuseumCard } from "@/components/explore/ExploreMuseumCard";
import type { PublicMuseumSummary } from "@/server/museumsRepository";

const CARD_GRID_CLASS = "grid grid-cols-1 items-start gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3";

function SectionHeading({ children }: { children: string }) {
  return <h2 className="font-heading text-xl text-ink">{children}</h2>;
}

/**
 * Splits published museums into "Live now" (currently has visitors) and
 * "Recently opened" (everything else, already newest-first from the
 * repository query) once the batched presence peek resolves. Before that
 * first reply arrives every museum's count is simply absent, so everything
 * renders under "Recently opened" and cards move up into "Live now" the
 * moment real counts come in -- no separate loading state needed.
 */
export function ExploreSections({ museums }: { museums: PublicMuseumSummary[] }) {
  const museumIds = useMemo(() => museums.map((museum) => museum.id), [museums]);
  const liveCounts = useVisitorCountsPeek(museumIds);

  const live = museums.filter((museum) => (liveCounts[museum.id] ?? 0) > 0);
  const liveIds = new Set(live.map((museum) => museum.id));
  const recent = museums.filter((museum) => !liveIds.has(museum.id));

  return (
    <div className="flex flex-col gap-12">
      {live.length > 0 && (
        <section>
          <SectionHeading>Live now</SectionHeading>
          <ul className={`mt-5 ${CARD_GRID_CLASS}`}>
            {live.map((museum) => (
              <ExploreMuseumCard key={museum.id} {...museum} liveCount={liveCounts[museum.id]} />
            ))}
          </ul>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <SectionHeading>Recently opened</SectionHeading>
          <ul className={`mt-5 ${CARD_GRID_CLASS}`}>
            {recent.map((museum) => (
              <ExploreMuseumCard key={museum.id} {...museum} liveCount={liveCounts[museum.id]} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
