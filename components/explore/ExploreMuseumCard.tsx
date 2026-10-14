import Link from "next/link";
import { EmptyFrameIcon } from "@/components/ui/EmptyState";
import type { PublicMuseumSummary } from "@/server/museumsRepository";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Read-only counterpart to dashboard's MuseumCard -- no edit/delete/publish
 * affordances, since /explore only ever lists other people's published
 * museums. `liveCount` is undefined until the batched socket peek
 * (useVisitorCountsPeek) resolves; the badge only renders once it's a
 * confirmed positive number, so a card never flashes "0 visitors" while
 * loading.
 *
 * The artwork renders at its own natural aspect ratio -- no fixed box, no
 * colored letterboxing behind it. Sizing comes entirely from `max-h` +
 * `max-w-full` on the <img> itself (width/height left auto), so the
 * browser derives whichever dimension is smaller without ever cropping or
 * distorting: a portrait piece stays narrower than the column and gets
 * height-capped so it can't tower over its neighbors; a landscape piece
 * naturally fills the column width. Each listing still aligns at the top
 * of its grid cell (the grid uses items-start) and the caption always
 * starts a fixed distance below the artwork regardless of its height, so
 * the row reads as aligned even though every image is a different size --
 * mounted like different-sized pieces on a wall, not thumbnails forced
 * into identical boxes. Everything below the artwork is plain flow
 * typography directly on the page -- no card, no nested placard/box
 * around the title.
 */
export function ExploreMuseumCard({
  id,
  name,
  description,
  createdAt,
  coverImageUrl,
  creatorDisplayName,
  liveCount,
}: PublicMuseumSummary & { liveCount?: number }) {
  return (
    <li className="group flex flex-col">
      <Link href={`/museum/${id}`} className="flex flex-col">
        {coverImageUrl ? (
          <div className="flex w-full justify-center">
            <div className="relative">
              <img
                src={coverImageUrl}
                alt=""
                className="max-h-[280px] w-auto max-w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.02] sm:max-h-[340px] lg:max-h-[400px]"
              />
              {!!liveCount && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-canvas/95 px-2.5 py-1 text-xs font-medium text-ink shadow-warm-xs backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-sage" aria-hidden="true" />
                  {liveCount} live
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-canvas-deep text-ink-muted">
            <EmptyFrameIcon />
            {!!liveCount && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-canvas/95 px-2.5 py-1 text-xs font-medium text-ink shadow-warm-xs backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-sage" aria-hidden="true" />
                {liveCount} live
              </span>
            )}
          </div>
        )}
        <div className="mt-4 flex flex-col gap-1.5">
          <h2 className="font-heading text-lg leading-snug text-ink">{name}</h2>
          <p className="text-sm text-ink-muted">
            by {creatorDisplayName}
            <span aria-hidden="true" className="mx-1.5 text-border">
              ·
            </span>
            {formatDate(createdAt)}
          </p>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">{description}</p>
          )}
          <span className="mt-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-terracotta-dark transition-colors duration-200 group-hover:text-terracotta">
            Enter museum
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            >
              →
            </span>
          </span>
        </div>
      </Link>
    </li>
  );
}
