import Link from "next/link";
import { AvatarHeadshot } from "@/components/avatar/AvatarHeadshot";
import type { PublicCreatorSummary } from "@/server/creatorsRepository";

/**
 * A person, not a museum -- shown as a centered profile card (avatar +
 * name) rather than the landscape photo-card layout ExploreMuseumCard
 * uses, so /explore/artists reads as a roster of people rather than a
 * second museum grid. AvatarHeadshot opens one WebGL canvas per card;
 * fine at the handful of creators this listing has today, but a real
 * scaling limit if the roster grows into the dozens (browsers cap
 * concurrent WebGL contexts well below that) -- worth revisiting with
 * viewport-based mounting if/when that happens.
 */
export function CreatorCard({ username, displayName, bio, museumCount, avatarConfiguration }: PublicCreatorSummary) {
  return (
    <li>
      <Link
        href={`/artist/${username}`}
        className="group flex flex-col items-center gap-4 rounded-[1.75rem] border border-border/70 bg-surface p-6 text-center shadow-warm-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-terracotta/40 hover:shadow-warm-md"
      >
        <AvatarHeadshot config={avatarConfiguration} className="h-28 w-28 transition-transform duration-300 ease-out group-hover:scale-[1.04]" />
        <div>
          <h2 className="font-heading text-lg text-ink">{displayName}</h2>
          <p className="text-xs text-ink-muted">
            @{username} · {museumCount} {museumCount === 1 ? "museum" : "museums"}
          </p>
          {bio && <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{bio}</p>}
        </div>
      </Link>
    </li>
  );
}
