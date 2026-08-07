import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { AvatarEditor } from "@/components/avatar/AvatarEditor";

export const metadata: Metadata = {
  title: "Customize your avatar",
  description: "Design the avatar that represents you across every MyMuseum you visit.",
};

export default function AvatarPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 sm:py-16">
        <header className="mb-10 max-w-2xl">
          <h1 className="font-display text-3xl text-ink sm:text-4xl">Customize your avatar</h1>
          <p className="mt-3 text-ink-muted">
            This is your identity across MyMuseum! 
            Choices are saved to this browser, so they&apos;ll be here next time.
          </p>
        </header>
        <AvatarEditor />
      </main>
      <SiteFooter />
    </>
  );
}
