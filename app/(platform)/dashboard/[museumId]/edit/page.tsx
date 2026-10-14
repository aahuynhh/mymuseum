import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { AuthGate } from "@/components/ui/AuthGate";
import { PencilIcon } from "@/components/ui/PageIcons";
import { getCurrentUser } from "@/lib/supabase/server";
import { getMuseumEditContext } from "@/server/museumsRepository";
import { getArtworksForMuseum } from "@/server/artworksRepository";
import { DEMO_MUSEUM_ID } from "@/data/museum";
import { EditMuseumMetadataForm } from "@/components/dashboard/edit/EditMuseumMetadataForm";
import { PublishToggle } from "@/components/dashboard/edit/PublishToggle";
import { CoverArtworkPicker } from "@/components/dashboard/edit/CoverArtworkPicker";
import { EditArtworkRow } from "@/components/dashboard/edit/EditArtworkRow";
import { AddArtworkForm } from "@/components/dashboard/edit/AddArtworkForm";
import { MAX_ARTWORKS_PER_MUSEUM } from "@/lib/artwork/limits";

export const metadata: Metadata = {
  title: "Edit Museum",
  description: "Edit your museum's details and artwork.",
};

export default async function EditMuseumPage({
  params,
}: {
  params: Promise<{ museumId: string }>;
}) {
  const { museumId } = await params;

  if (museumId === DEMO_MUSEUM_ID) notFound();

  const user = await getCurrentUser();

  if (!user) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
        <AuthGate icon={<PencilIcon />} accent="terracotta" title="Sign in to edit this museum" />
      </main>
    );
  }

  // getMuseumEditContext is scoped by ownerId in addition to RLS -- a museum
  // that doesn't exist and a museum owned by someone else are
  // indistinguishable here, both rendering the same 404, so this route never
  // reveals whether a given id belongs to another user.
  const museum = await getMuseumEditContext(museumId, user.id);
  if (!museum) notFound();

  const artworks = await getArtworksForMuseum(museumId);

  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 pb-28 pt-24 sm:pb-32 sm:pt-28">
      <PageHeader
        icon={<PencilIcon />}
        accent="terracotta"
        title={museum.name}
        actions={
          <LinkButton href={`/museum/${museum.id}`} variant="secondary">
            View live museum
          </LinkButton>
        }
      />

      <div className="flex flex-col gap-10">
        <PublishToggle museumId={museum.id} initialIsPublished={museum.isPublished} />

        <EditMuseumMetadataForm
          museumId={museum.id}
          initialName={museum.name}
          initialDescription={museum.description}
          initialTheme={museum.theme}
        />

        <CoverArtworkPicker
          museumId={museum.id}
          artworks={artworks}
          initialCoverArtworkId={museum.coverArtworkId}
        />

        <section className="flex flex-col gap-5">
          <div>
            <h2 className="font-heading text-xl text-ink">Artwork</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {artworks.length} of {MAX_ARTWORKS_PER_MUSEUM}
            </p>
          </div>
          <ul className="flex flex-col gap-4">
            {artworks.map((artwork) => (
              <EditArtworkRow
                key={artwork.id}
                museumId={museum.id}
                artwork={artwork}
                canDelete={artworks.length > 1}
              />
            ))}
          </ul>
        </section>

        <AddArtworkForm museumId={museum.id} currentCount={artworks.length} />
      </div>
    </main>
  );
}
