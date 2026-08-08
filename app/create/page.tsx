import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { CreateMuseumForm } from "@/components/create/CreateMuseumForm";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Create your museum",
  description: "Upload your artwork and get a shareable virtual museum in a few minutes.",
};

export default async function CreatePage() {
  const user = await getCurrentUser();

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:py-16">
        <PageHeader
          eyebrow="New museum"
          title="Build your own gallery"
          description="Upload a few pieces, pick a gallery theme, and get a shareable virtual museum."
        />
        {user ? (
          <CreateMuseumForm />
        ) : (
          <div className="rounded-[1.75rem] border border-border/70 bg-surface p-8 text-center shadow-warm-sm sm:p-12">
            <p className="font-display text-sm italic text-terracotta-dark">One more step</p>
            <h2 className="mt-2 font-display text-2xl text-ink">Sign in to build your gallery</h2>
            <p className="mx-auto mt-3 max-w-sm text-ink-muted">
              An account keeps your museum yours -- only you will ever be able to edit it.
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
        )}
      </main>
      <SiteFooter />
    </>
  );
}
