import type { ThreadMessage } from "@/server/messagesRepository";
import { ReportMessageButton } from "./ReportMessageButton";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Plain chronological message list -- deliberately NOT chat bubbles. Every
 * message renders identically regardless of who sent it: sender name +
 * timestamp on one line, body below, full width, no left/right alignment
 * by sender, no colored bubbles, no avatar-next-to-message. Museum Mail is
 * asynchronous mail, not a live conversation window, and the layout should
 * read that way even when a thread has gone back and forth.
 */
export function ThreadMessageList({
  messages,
  currentUserId,
  otherParticipantName,
}: {
  messages: ThreadMessage[];
  currentUserId: string;
  otherParticipantName: string;
}) {
  return (
    <ul className="flex flex-col divide-y divide-border/70">
      {messages.map((message) => {
        const isOwn = message.senderId === currentUserId;
        return (
          <li key={message.id} className="py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="font-heading text-sm text-ink">{isOwn ? "You" : otherParticipantName}</p>
              <p className="text-xs text-ink-muted">{formatTimestamp(message.createdAt)}</p>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{message.body}</p>
            {!isOwn && (
              <div className="mt-2">
                <ReportMessageButton messageId={message.id} alreadyReported={message.reportedAt !== null} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
