import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExploreMuseumCard } from "@/components/explore/ExploreMuseumCard";
import { AvatarHeadshot } from "@/components/avatar/AvatarHeadshot";
import { LinkButton } from "@/components/ui/Button";
import { MessageArtistButton } from "@/components/messages/MessageArtistButton";
import { getCreatorMuseums } from "@/server/creatorsRepository";
import { getCurrentUser } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const result = await getCreatorMuseums(username);
  if (!result) return { title: "Artist not found" };

  return {
    title: result.creator.displayName,
    description: result.creator.bio || `${result.creator.displayName}'s museums on MyMuseum.`,
  };
}

export default async function ArtistProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const [result, user] = await Promise.all([getCreatorMuseums(username), getCurrentUser()]);
  if (!result) notFound();

  const { creator, museums } = result;
  const isOwnProfile = user?.id === creator.id;

  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center">
        <AvatarHeadshot config={creator.avatarConfiguration} className="h-28 w-28 sm:h-32 sm:w-32" />
        <div className="flex-1">
          <h1 className="font-heading text-3xl font-semibold text-ink sm:text-4xl">{creator.displayName}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            @{creator.username} · {museums.length} published {museums.length === 1 ? "museum" : "museums"}
          </p>
          {creator.bio && <p className="mt-3 max-w-xl leading-relaxed text-ink-muted">{creator.bio}</p>}
        </div>
        {isOwnProfile ? (
          <LinkButton href="/dashboard/profile" variant="secondary">
            Edit Profile
          </LinkButton>
        ) : (
          creator.acceptsMessages && (
            <MessageArtistButton
              recipientId={creator.id}
              recipientName={creator.displayName}
              currentUserId={user?.id ?? null}
            />
          )
        )}
      </header>

      {museums.length === 0 ? (
        <EmptyState
          title="No museums published yet"
          description={`${creator.displayName} hasn't published a museum yet -- check back later.`}
        />
      ) : (
        <ul className="grid grid-cols-1 items-start gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {museums.map((museum) => (
            <ExploreMuseumCard key={museum.id} {...museum} />
          ))}
        </ul>
      )}
    </main>
  );
}
