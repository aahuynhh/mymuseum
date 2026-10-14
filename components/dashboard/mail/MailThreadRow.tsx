import Link from "next/link";
import type { ThreadSummary } from "@/server/messagesRepository";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** One row in the Museum Mail inbox list -- server-renderable, no client
 * state. Unread threads get a small dot and bolder text, not a numeric
 * badge, matching the same restrained-unread-signal choice made in
 * AccountMenu.tsx. */
export function MailThreadRow({ thread }: { thread: ThreadSummary }) {
  const context = thread.artwork
    ? `${thread.museum?.name ?? "a museum"} · ${thread.artwork.title}`
    : thread.museum?.name ?? null;

  return (
    <li>
      <Link
        href={`/dashboard/mail/${thread.threadId}`}
        className="flex items-start justify-between gap-4 px-1 py-4 transition-colors duration-200 hover:bg-canvas-deep/50"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {thread.unreadCount > 0 && (
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta-dark" />
            )}
            <p className={thread.unreadCount > 0 ? "font-semibold text-ink" : "font-medium text-ink"}>
              {thread.otherParticipant.displayName}
            </p>
          </div>
          {context && <p className="mt-0.5 text-xs text-ink-muted">{context}</p>}
          <p className="mt-1 line-clamp-1 text-sm text-ink-muted">{thread.lastMessage.body}</p>
        </div>
        <p className="shrink-0 whitespace-nowrap text-xs text-ink-muted">
          {formatTimestamp(thread.lastMessage.createdAt)}
        </p>
      </Link>
    </li>
  );
}
