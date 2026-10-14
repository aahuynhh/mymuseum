import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { AuthGate } from "@/components/ui/AuthGate";
import { EmptyState } from "@/components/ui/EmptyState";
import { MuseumIcon } from "@/components/ui/PageIcons";
import { getCurrentUser } from "@/lib/supabase/server";
import { getMuseumSummariesForOwner } from "@/server/museumsRepository";
import { MuseumCard } from "@/components/dashboard/MuseumCard";

export const metadata: Metadata = {
  title: "My Museums",
  description: "Your museums, all in one place.",
};

export default async function DashboardPage() {
  // Ownership is always derived from the server-verified session -- never
  // from a client-supplied id -- and the repository filters by that id, so
  // one user's dashboard can never list another user's museums.
  const user = await getCurrentUser();

  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
      {!user ? (
        <AuthGate
          icon={<MuseumIcon />}
          accent="terracotta"
          title="Sign in to see your museums"
          description="Your museums are tied to your account -- sign in to view and open them."
        />
      ) : (
        <DashboardContent ownerId={user.id} />
      )}
    </main>
  );
}

async function DashboardContent({ ownerId }: { ownerId: string }) {
  const museums = await getMuseumSummariesForOwner(ownerId);

  return (
    <>
      <PageHeader icon={<MuseumIcon />} accent="terracotta" title="My Museums" />

      {museums.length === 0 ? (
        <EmptyState
          title="No museums yet"
          description="Upload a few pieces, pick a gallery theme, and get a shareable virtual museum in a few minutes."
          actions={
            <LinkButton href="/create" size="lg">
              Create your first museum
            </LinkButton>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {museums.map((museum) => (
            <MuseumCard key={museum.id} {...museum} />
          ))}
        </ul>
      )}
    </>
  );
}
