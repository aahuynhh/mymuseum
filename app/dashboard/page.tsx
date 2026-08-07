import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { LinkButton } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/supabase/server";
import { getMuseumSummariesForOwner } from "@/server/museumsRepository";

export const metadata: Metadata = {
  title: "My Museums",
  description: "Your museums, all in one place.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function DashboardPage() {
  // Ownership is always derived from the server-verified session -- never
  // from a client-supplied id -- and the repository filters by that id, so
  // one user's dashboard can never list another user's museums.
  const user = await getCurrentUser();

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:py-16">
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
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-sm italic text-terracotta-dark">Create My Museum</p>
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">My Museums</h1>
        </div>
        <LinkButton href="/create" size="md">
          Create Museum
        </LinkButton>
      </header>

      {museums.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-canvas-deep/50 p-10 text-center">
          <p className="font-display text-xl text-ink">No museums yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            Upload a few pieces, pick a gallery theme, and get a shareable virtual museum in a
            few minutes.
          </p>
          <div className="mt-6">
            <LinkButton href="/create" size="lg">
              Create your first museum
            </LinkButton>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {museums.map((museum) => (
            <li
              key={museum.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-border/70 bg-surface p-6 shadow-warm-sm"
            >
              <div className="min-w-0">
                <h2 className="font-display text-xl text-ink">{museum.name}</h2>
                {museum.description && (
                  <p className="mt-1 max-w-md truncate text-sm text-ink-muted">
                    {museum.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-ink-muted">Created {formatDate(museum.createdAt)}</p>
              </div>
              <LinkButton href={`/museum/${museum.id}`} variant="secondary">
                Open Museum
              </LinkButton>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
