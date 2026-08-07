import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMO_MUSEUM, DEMO_MUSEUM_ID } from "@/data/museum";
import { DEMO_ARTIST } from "@/data/demoArtist";
import { getStoredMuseum } from "@/server/museumStore";
import { MuseumExperienceLoader } from "@/components/museum/MuseumExperienceLoader";

function getMuseum(museumId: string) {
  if (museumId === DEMO_MUSEUM_ID) return DEMO_MUSEUM;
  return getStoredMuseum(museumId) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ museumId: string }>;
}): Promise<Metadata> {
  const { museumId } = await params;
  const museum = getMuseum(museumId);
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
  const museum = getMuseum(museumId);
  if (!museum) notFound();

  const exitHref = museumId === DEMO_MUSEUM_ID ? `/artist/${DEMO_ARTIST.username}` : "/";

  return <MuseumExperienceLoader museum={museum} exitHref={exitHref} />;
}
