import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LinkButton } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/supabase/server";
import { getThreadMessages, markThreadRead, isBlocked } from "@/server/messagesRepository";
import { ThreadMessageList } from "@/components/dashboard/mail/ThreadMessageList";
import { ReplyComposer } from "@/components/dashboard/mail/ReplyComposer";
import { BlockSenderButton } from "@/components/dashboard/mail/BlockSenderButton";

export const metadata: Metadata = {
  title: "Museum Mail",
};

export default async function MailThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
        <div className="rounded-[1.75rem] border border-border/70 bg-surface p-8 text-center shadow-warm-sm sm:p-12">
          <p className="font-display text-sm italic text-terracotta-dark">Museum Mail</p>
          <h1 className="mt-2 font-heading text-2xl text-ink">Sign in to view this conversation</h1>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/sign-in" size="lg">
              Sign in
            </LinkButton>
          </div>
        </div>
      </main>
    );
  }

  const thread = await getThreadMessages(threadId, user.id);
  if (!thread) notFound();

  await markThreadRead(threadId, user.id);
  const blocked = await isBlocked(user.id, thread.otherParticipant.id);

  const context = thread.artwork
    ? `${thread.museum?.name ?? "a museum"} · ${thread.artwork.title}`
    : thread.museum?.name;

  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
      <Link
        href="/dashboard/mail"
        className="text-sm font-medium text-ink-muted underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
      >
        ← Back to Museum Mail
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-sm italic text-terracotta-dark">Museum Mail</p>
          <h1 className="mt-2 font-heading text-2xl text-ink sm:text-3xl">
            {thread.otherParticipant.displayName}
          </h1>
          {context && <p className="mt-1 text-sm text-ink-muted">About {context}</p>}
        </div>
        <BlockSenderButton
          otherUserId={thread.otherParticipant.id}
          otherDisplayName={thread.otherParticipant.displayName}
          initiallyBlocked={blocked}
        />
      </div>

      <div className="mt-8 rounded-[1.75rem] border border-border/70 bg-surface px-6 shadow-warm-sm sm:px-8">
        <ThreadMessageList
          messages={thread.messages}
          currentUserId={user.id}
          otherParticipantName={thread.otherParticipant.displayName}
        />
        <div className="pb-6 sm:pb-8">
          <ReplyComposer threadId={thread.threadId} />
        </div>
      </div>
    </main>
  );
}
