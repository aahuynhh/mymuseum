import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { CreateMuseumForm } from "@/components/create/CreateMuseumForm";

export const metadata: Metadata = {
  title: "Create your museum",
  description: "Upload your artwork and get a shareable virtual museum in a few minutes.",
};

export default function CreatePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:py-16">
        <header className="mb-10 max-w-2xl">
          <p className="font-display text-sm italic text-terracotta-dark">Create My Museum</p>
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Build your own gallery</h1>
          <p className="mt-3 text-ink-muted">
            Upload a few pieces, pick a gallery theme, and get a shareable virtual museum.
          </p>
        </header>
        <CreateMuseumForm />
      </main>
      <SiteFooter />
    </>
  );
}
