import Link from "next/link";
import { EmptyFrameIcon } from "@/components/ui/EmptyState";
import type { PublicMuseumSummary } from "@/server/museumsRepository";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Vertical stagger only, indexed by position (not randomized, so server
// and client render the same markup) -- the wall's "curated, not gridded"
// feel now comes from each piece's own real proportions instead of a
// cycled fixed aspect ratio, so it no longer fights the artwork's actual
// shape.
const OFFSETS = ["lg:mt-0", "lg:mt-12", "lg:mt-6"];

/**
 * A museum mounted on the homepage's deep-blue gallery wall: a framed
 * image and a plain-text placard underneath, not a card. Distinct from
 * ExploreMuseumCard (used on /explore and elsewhere against a cream page,
 * where a light card body reads fine as a portfolio tile) -- here, that
 * same cream card body would look like a website card floating on a wall,
 * so this skips card chrome (no background fill, no rounded corners, no
 * mat) and lets a single thin frame line plus the placard's own typography
 * carry the "museum" read.
 *
 * The frame hugs the artwork's own natural aspect ratio (max-h + max-w on
 * the <img>, width/height left auto) instead of forcing it into a fixed
 * box with object-cover -- a portrait piece stays narrower and gets
 * height-capped, a landscape piece uses more width, and nothing is ever
 * cropped or distorted. Only the no-cover-image fallback keeps a fixed
 * aspect box, since there's no real artwork shape to preserve there.
 *
 * Frame and plaque share one `inline-flex flex-col` shell so they read as a
 * single mounted unit: the shell's own shrink-to-fit width comes from its
 * widest child (the frame, sized to the image), and `items-stretch` then
 * forces the plaque to fill that exact width -- no hardcoded plaque width,
 * no JS measurement, it's just derived from the image. The description is
 * capped at a reading-width max so an unusually long one can't blow that
 * width out past the image; short title/artist-date lines are in no
 * practical danger of doing the same.
 */
export function ExhibitionWallPiece({
  museum,
  index,
}: {
  museum: PublicMuseumSummary & { liveCount?: number };
  index: number;
}) {
  const { id, name, description, createdAt, coverImageUrl, creatorDisplayName, liveCount } = museum;
  const offset = OFFSETS[index % OFFSETS.length];

  return (
    <li className={`group flex w-full max-w-sm flex-col ${offset}`}>
      <Link href={`/museum/${id}`} className="block">
        <div className="inline-flex flex-col items-stretch">
          <div className="relative">
            {/* Warm spotlight wash above the frame -- restrained, not a
                full-section gradient, so it reads as track lighting rather
                than a marketing glow. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-8 -top-12 h-24 bg-[radial-gradient(ellipse_at_center,#ffdfa8,transparent_70%)] opacity-[0.18] blur-2xl"
            />
            {coverImageUrl ? (
              <div className="relative inline-block border border-antique-gold/35 bg-[#0f2a41] shadow-[0_20px_40px_-22px_rgba(6,16,26,0.65)]">
                <img
                  src={coverImageUrl}
                  alt=""
                  className="block max-h-[320px] w-auto max-w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                />
                {!!liveCount && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-canvas/95 px-2.5 py-1 text-xs font-medium text-ink shadow-warm-xs backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-sage" aria-hidden="true" />
                    {liveCount} live
                  </span>
                )}
              </div>
            ) : (
              <div className="relative flex aspect-[4/3] w-full items-center justify-center border border-antique-gold/35 bg-[#0f2a41] text-surface/35 shadow-[0_20px_40px_-22px_rgba(6,16,26,0.65)]">
                <EmptyFrameIcon />
                {!!liveCount && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-canvas/95 px-2.5 py-1 text-xs font-medium text-ink shadow-warm-xs backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-sage" aria-hidden="true" />
                    {liveCount} live
                  </span>
                )}
              </div>
            )}
          </div>

          {/* A wall-label plaque, not a card -- flat, thin-bordered, and
              (via the shell above) exactly as wide as the frame, never the
              li's full column width. Colors match Plaque.tsx's palette for
              consistency with the in-museum 3D label, but this doesn't
              reuse that component: its two-plane offset dark edge reads as
              sticker/drop-shadow depth, deliberately absent here.

              Deliberately uneven type hierarchy rather than four same-weight
              lines: serif+semibold title, then the sans metadata line sits
              close beneath it (same visual "block" as the title, tightest
              gap), then a clearer gap before the description, then the
              widest gap of all before the CTA -- so the eye reads it as
              title/meta, description, action, not one undifferentiated
              stack. */}
          <div className="mt-3 rounded-md border border-[#e4d9c8] bg-[#faf7f2] px-5 py-2 text-center">
            <h3 className="truncate font-display text-base font-semibold leading-tight text-[#3c2e28]">
              {name}
            </h3>
            <p className="mt-0.5 truncate text-xs leading-tight text-[#8a7a6c]">
              {creatorDisplayName}
              <span aria-hidden="true" className="mx-1.5">
                ·
              </span>
              {formatDate(createdAt)}
            </p>
            {description && (
              <p className="mx-auto mt-1.5 line-clamp-2 max-w-[20rem] text-sm leading-tight text-[#5a4d44]">
                {description}
              </p>
            )}
            <span className="mt-2.5 inline-flex items-center justify-center gap-1.5 text-sm font-medium leading-tight text-terracotta-dark transition-colors duration-200 group-hover:text-terracotta">
              Enter museum
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-0.5"
              >
                →
              </span>
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
