import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMO_MUSEUM, DEMO_MUSEUM_ID } from "@/data/museum";
import { getMuseumById } from "@/server/museumsRepository";
import { getCurrentUser } from "@/lib/supabase/server";
import { getMyProfile, getAcceptsMessages } from "@/server/profilesRepository";
import { MuseumExperienceLoader } from "@/components/museum/MuseumExperienceLoader";
import type { AvatarConfiguration } from "@/types";
import type { User } from "@supabase/supabase-js";

async function getMuseum(museumId: string) {
  if (museumId === DEMO_MUSEUM_ID) return DEMO_MUSEUM;
  return getMuseumById(museumId);
}

/** The signed-in visitor's saved account avatar, if any -- this is what
 * should appear as their character in-game, not the separate local-storage
 * "guest" avatar (hooks/useAvatarConfig.ts), which is only a fallback for
 * visitors without an account. Reading it here (server-side, per request)
 * means an edit saved on the profile page is picked up the next time this
 * page renders, with no client-side caching to go stale. */
async function getAccountAvatarConfig(user: User | null): Promise<AvatarConfiguration | null> {
  if (!user) return null;
  const profile = await getMyProfile(user.id);
  return profile?.avatarConfiguration ?? null;
}

/** Whether Museum Mail's "Leave a note"/"Message the artist" entry points
 * should render for this museum. The demo museum's `ownerId`
 * ("alayna-huynh") isn't a real auth.users row -- it exists only as a
 * hardcoded seed object (data/museum.ts), not a row in the real `museums`
 * table -- so it's excluded here the same way it's already excluded from
 * editing elsewhere in the app, rather than letting a message attempt fail
 * with a confusing "museum not found" error. */
async function getAcceptsMessagesForOwner(museumId: string, ownerId: string): Promise<boolean> {
  if (museumId === DEMO_MUSEUM_ID) return false;
  return getAcceptsMessages(ownerId);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ museumId: string }>;
}): Promise<Metadata> {
  const { museumId } = await params;
  const museum = await getMuseum(museumId);
  if (!museum) return { title: "Museum not found" };

  return {
    title: museum.name,
    description: museum.description,
    openGraph: { title: `${museum.name} · MyMuseum`, description: museum.description },
  };
}

export default async function MuseumPage({
  params,
}: {
  params: Promise<{ museumId: string }>;
}) {
  const { museumId } = await params;
  const [museum, user] = await Promise.all([getMuseum(museumId), getCurrentUser()]);
  if (!museum) notFound();

  const [accountAvatarConfig, acceptsMessages] = await Promise.all([
    getAccountAvatarConfig(user),
    getAcceptsMessagesForOwner(museumId, museum.ownerId),
  ]);

  // Exiting any museum -- demo or real -- goes back to the discovery page
  // rather than the marketing homepage, so leaving a room always leads
  // toward "browse more museums" instead of dead-ending on a landing page.
  return (
    <MuseumExperienceLoader
      museum={museum}
      exitHref="/explore"
      accountAvatarConfig={accountAvatarConfig}
      currentUserId={user?.id ?? null}
      acceptsMessages={acceptsMessages}
    />
  );
}
