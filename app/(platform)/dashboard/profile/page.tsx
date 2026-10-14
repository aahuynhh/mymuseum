import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { AuthGate } from "@/components/ui/AuthGate";
import { PersonIcon } from "@/components/ui/PageIcons";
import { getCurrentUser } from "@/lib/supabase/server";
import { getMyProfile } from "@/server/profilesRepository";
import { ProfileEditor } from "@/components/dashboard/profile/ProfileEditor";
import { AcceptsMessagesToggle } from "@/components/dashboard/profile/AcceptsMessagesToggle";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Edit your public artist profile.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
        <AuthGate
          icon={<PersonIcon />}
          accent="gold"
          title="Sign in to edit your profile"
          description="Your profile is tied to your account -- sign in to view and edit it."
        />
      </main>
    );
  }

  // Every signed-up user has a profile row (auto-provisioned on signup, see
  // 0001_init.sql's handle_new_user trigger), so a null here means the
  // avatar_configuration/bio migration (0007) hasn't been applied yet
  // rather than "this user doesn't have one."
  const profile = await getMyProfile(user.id);
  if (!profile) notFound();

  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
      <PageHeader
        icon={<PersonIcon />}
        accent="gold"
        title="Edit your profile"
        description="This is what other people see on your public artist page."
      />

      <div className="flex flex-col gap-10">
        <AcceptsMessagesToggle initialAcceptsMessages={profile.acceptsMessages} />

        <ProfileEditor
          initialDisplayName={profile.displayName}
          initialUsername={profile.username}
          initialBio={profile.bio}
          initialConfig={profile.avatarConfiguration}
        />
      </div>
    </main>
  );
}
