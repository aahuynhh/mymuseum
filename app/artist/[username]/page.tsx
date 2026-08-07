import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMO_ARTIST, DEMO_ARTIST_AVATAR } from "@/data/demoArtist";
import { DEMO_MUSEUM } from "@/data/museum";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { LinkButton } from "@/components/ui/Button";
import { CopyLinkButton } from "@/components/museum/CopyLinkButton";
import { LiveVisitorBadge } from "@/components/profile/LiveVisitorBadge";
import { ArtworkPreviewSection } from "@/components/profile/ArtworkPreviewSection";
import { ProfileAvatarPreviewLoader } from "@/components/profile/ProfileAvatarPreviewLoader";

function getArtist(username: string) {
  if (username !== DEMO_ARTIST.username) return null;
  return DEMO_ARTIST;
}

const SITE_URL = "https://mymuseum.example.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const artist = getArtist(username);
  if (!artist) return { title: "Artist not found" };

  return {
    title: artist.displayName,
    description: artist.bio,
    openGraph: { title: `${artist.displayName} · MyMuseum`, description: artist.bio },
  };
}

export default async function ArtistProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const artist = getArtist(username);
  if (!artist) notFound();

  const museum = DEMO_MUSEUM;
  const museumUrl = `${SITE_URL}/museum/${museum.id}`;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <section className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <ProfileAvatarPreviewLoader config={DEMO_ARTIST_AVATAR} />
            <div>
              <h1 className="font-display text-3xl text-ink sm:text-4xl">{artist.displayName}</h1>
              <p className="mt-1 text-sm text-ink-muted">@{artist.username}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {artist.disciplines.map((discipline) => (
                  <li
                    key={discipline}
                    className="rounded-full border border-border/70 bg-canvas-deep px-3 py-1 text-xs font-medium text-ink"
                  >
                    {discipline}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-6 max-w-2xl leading-relaxed text-ink-muted">{artist.bio}</p>

          <div className="mt-10 rounded-[1.75rem] border border-border/70 bg-surface p-6 shadow-warm-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-display text-sm italic text-terracotta-dark">
                  Museum preview
                </p>
                <h2 className="mt-1 font-display text-2xl text-ink">{museum.name}</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{museum.description}</p>
              </div>
              <LiveVisitorBadge museumId={museum.id} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href={`/museum/${museum.id}`}>Enter Museum</LinkButton>
              <CopyLinkButton url={museumUrl} />
            </div>
          </div>
        </section>

        <section id="grid" className="border-t border-border/70 bg-canvas-deep/60 py-14 sm:py-16">
          <div className="mx-auto w-full max-w-5xl px-6">
            <p className="font-display text-sm italic text-terracotta-dark">The collection</p>
            <h2 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Browse every piece</h2>
            <p className="mt-2 max-w-xl text-sm text-ink-muted">
              An accessible grid view of every piece in {museum.name} -- no 3D navigation
              required.
            </p>
            <div className="mt-8">
              <ArtworkPreviewSection artworks={museum.artworks} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
