import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/supabase/server";
import { getMyProfile } from "@/server/profilesRepository";
import { AvatarEditor } from "@/components/avatar/AvatarEditor";

export const metadata: Metadata = {
  title: "Customize your avatar",
  description: "Design the avatar that represents you across every MyMuseum you visit.",
};

export default async function AvatarPage() {
  const user = await getCurrentUser();
  const profile = user ? await getMyProfile(user.id) : null;

  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-heading text-3xl text-ink sm:text-4xl">Customize your avatar</h1>
        <p className="mt-3 text-ink-muted">
          {profile
            ? "This is your identity across MyMuseum! Saved to your account, so it's yours everywhere you sign in."
            : "This is your identity across MyMuseum! Choices are saved to this browser, so they'll be here next time."}
        </p>
      </header>
      <AvatarEditor accountConfig={profile?.avatarConfiguration ?? null} />
    </main>
  );
}
