const CARD_GRID_CLASS = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";
const MUSEUM_GRID_CLASS = "grid grid-cols-1 items-start gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3";

/** Placeholder matching ExploreMuseumCard's shape (fixed-aspect stage +
 * plain caption), shown by app/explore/loading.tsx while the museum list
 * streams in so the nav click feels instant instead of frozen. */
function MuseumCardSkeleton() {
  return (
    <li className="flex flex-col">
      <div className="aspect-[4/3] w-full animate-pulse bg-canvas-deep" />
      <div className="mt-4 flex flex-col gap-2">
        <div className="h-5 w-2/3 animate-pulse rounded-full bg-canvas-deep" />
        <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-canvas-deep" />
        <div className="mt-2 h-4 w-28 animate-pulse rounded-full bg-canvas-deep" />
      </div>
    </li>
  );
}

export function MuseumGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className={MUSEUM_GRID_CLASS}>
      {Array.from({ length: count }, (_, index) => (
        <MuseumCardSkeleton key={index} />
      ))}
    </ul>
  );
}

/** Placeholder matching CreatorCard's shape (round avatar + two text
 * lines), shown by app/explore/artists/loading.tsx. */
function CreatorCardSkeleton() {
  return (
    <li className="flex flex-col items-center gap-4 rounded-[1.75rem] border border-border/70 bg-surface p-6 text-center shadow-warm-sm">
      <div className="h-28 w-28 animate-pulse rounded-full bg-canvas-deep" />
      <div className="flex flex-col items-center gap-2">
        <div className="h-4 w-24 animate-pulse rounded-full bg-canvas-deep" />
        <div className="h-3 w-32 animate-pulse rounded-full bg-canvas-deep" />
      </div>
    </li>
  );
}

export function CreatorGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className={CARD_GRID_CLASS}>
      {Array.from({ length: count }, (_, index) => (
        <CreatorCardSkeleton key={index} />
      ))}
    </ul>
  );
}
