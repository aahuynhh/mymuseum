import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AuthGate } from "@/components/ui/AuthGate";
import { EmptyState } from "@/components/ui/EmptyState";
import { EnvelopeIcon } from "@/components/ui/PageIcons";
import { getCurrentUser } from "@/lib/supabase/server";
import { listThreadsForUser } from "@/server/messagesRepository";
import { MailThreadRow } from "@/components/dashboard/mail/MailThreadRow";

export const metadata: Metadata = {
  title: "Museum Mail",
  description: "Private notes between you and other MyMuseum visitors and artists.",
};

export default async function MailPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
        <AuthGate
          icon={<EnvelopeIcon />}
          accent="dustyBlue"
          title="Sign in to view your mail"
          description="Museum Mail is tied to your account -- sign in to see notes you've sent or received."
        />
      </main>
    );
  }

  const threads = await listThreadsForUser(user.id);

  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
      <PageHeader
        icon={<EnvelopeIcon />}
        accent="dustyBlue"
        title="Your mail"
        description="Private notes you've sent or received -- about a museum, or about one piece in it."
      />

      {threads.length === 0 ? (
        <EmptyState
          title="No messages yet"
          description="Notes visitors leave for you, or replies to notes you've sent, will show up here."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border/70 rounded-[1.75rem] border border-border/70 bg-surface px-5 shadow-warm-sm">
          {threads.map((thread) => (
            <MailThreadRow key={thread.threadId} thread={thread} />
          ))}
        </ul>
      )}
    </main>
  );
}
