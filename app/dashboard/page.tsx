import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
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
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 sm:py-16">
        {!user ? (
          <div className="rounded-[1.75rem] border border-border/70 bg-surface p-8 text-center shadow-warm-sm sm:p-12">
            <p className="font-display text-sm italic text-terracotta-dark">My Museums</p>
            <h1 className="mt-2 font-display text-2xl text-ink">Sign in to see your museums</h1>
            <p className="mx-auto mt-3 max-w-sm text-ink-muted">
              Your museums are tied to your account -- sign in to view and open them.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <LinkButton href="/sign-in" size="lg">
                Sign in
              </LinkButton>
              <LinkButton href="/sign-up" variant="secondary" size="lg">
                Create an account
              </LinkButton>
            </div>
          </div>
        ) : (
          <DashboardContent ownerId={user.id} />
        )}
      </main>
      <SiteFooter />
    </>
  );
}

async function DashboardContent({ ownerId }: { ownerId: string }) {
  const museums = await getMuseumSummariesForOwner(ownerId);

  return (
    <>
      <PageHeader
        eyebrow="My Museums"
        title="My Museums"
        actions={
          <LinkButton href="/create" size="md">
            Create Museum
          </LinkButton>
        }
      />

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
