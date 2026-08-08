import { LinkButton } from "@/components/ui/Button";
import { PublishBadge } from "@/components/ui/PublishBadge";
import { EmptyFrameIcon } from "@/components/ui/EmptyState";
import { CopyLinkButton } from "@/components/museum/CopyLinkButton";
import { DeleteMuseumButton } from "@/components/dashboard/DeleteMuseumButton";
import type { MuseumSummary } from "@/server/museumsRepository";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Dashboard museum card -- a cover thumbnail (the museum's first artwork,
 * resolved server-side through the existing private-Storage signed-URL
 * path, never a public bucket) plus name, visibility, description, and
 * actions. Delete stays a low-emphasis text trigger even in this denser
 * layout; only its confirmation step uses the danger treatment.
 */
export function MuseumCard({ id, name, description, createdAt, isPublished, coverImageUrl }: MuseumSummary) {
  return (
    <li className="flex flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-surface shadow-warm-sm">
      <div className="aspect-[4/3] w-full overflow-hidden border-b border-border/60 bg-canvas-deep">
        {coverImageUrl ? (
          // Signed Storage URL for this museum's first artwork, same
          // resolution path as every other artwork image in the app.
          <img src={coverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-muted">
            <EmptyFrameIcon />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg text-ink">{name}</h2>
            <PublishBadge isPublished={isPublished} />
          </div>
          {description && <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{description}</p>}
          <p className="mt-2 text-xs text-ink-muted">Created {formatDate(createdAt)}</p>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <LinkButton href={`/dashboard/${id}/edit`} variant="secondary" size="md">
              Edit
            </LinkButton>
            <LinkButton href={`/museum/${id}`} variant="secondary" size="md">
              View
            </LinkButton>
            <CopyLinkButton path={`/museum/${id}`} isPrivate={!isPublished} />
          </div>
          <DeleteMuseumButton museumId={id} museumName={name} />
        </div>
      </div>
    </li>
  );
}
