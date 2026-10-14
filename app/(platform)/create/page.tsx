import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AuthGate } from "@/components/ui/AuthGate";
import { PlusIcon } from "@/components/ui/PageIcons";
import { CreateMuseumForm } from "@/components/create/CreateMuseumForm";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Create your museum",
  description: "Upload your artwork and get a shareable virtual museum in a few minutes.",
};

export default async function CreatePage() {
  const user = await getCurrentUser();

  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
      <PageHeader
        icon={<PlusIcon />}
        accent="sage"
        title="Build your own gallery"
        description="Upload a few pieces, pick a gallery theme, and get a shareable virtual museum."
      />
      {user ? (
        <CreateMuseumForm />
      ) : (
        <AuthGate
          icon={<PlusIcon />}
          accent="sage"
          title="Sign in to build your gallery"
          description="An account keeps your museum yours -- only you will ever be able to edit it."
        />
      )}
    </main>
  );
}
