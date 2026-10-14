import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getMyProfile } from "@/server/profilesRepository";

/** "My Profile" in the header lands here, which immediately forwards to the
 * signed-in user's own public artist page -- clicking profile should show
 * your profile, not drop you straight into the edit form (that's reached
 * from an "Edit Profile" action on the public page instead). */
export default async function ProfileRedirectPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const profile = await getMyProfile(user.id);
  if (!profile) redirect("/dashboard/profile");

  redirect(`/artist/${profile.username}`);
}
