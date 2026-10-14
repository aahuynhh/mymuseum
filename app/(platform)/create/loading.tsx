import { PageHeader } from "@/components/ui/PageHeader";
import { PlusIcon } from "@/components/ui/PageIcons";

/** Instant pending UI for /create -- getCurrentUser() makes a network call
 * to Supabase to check the session, which otherwise left the HUD's
 * "Create" control looking frozen for a moment on click. */
export default function Loading() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
      <PageHeader
        icon={<PlusIcon />}
        accent="sage"
        title="Build your own gallery"
        description="Upload a few pieces, pick a gallery theme, and get a shareable virtual museum."
      />
      <div className="h-64 w-full animate-pulse rounded-[1.75rem] border border-border/70 bg-surface shadow-warm-sm" />
    </main>
  );
}
