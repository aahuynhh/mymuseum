import { NextResponse } from "next/server";
import { GALLERY_THEMES, type GalleryThemeId } from "@/game/museum/themes";
import { generateSingleRoomMuseum, type UploadedArtworkInput } from "@/game/museum/autoLayout";
import { hasMuseum, createMuseum } from "@/server/museumsRepository";
import { DEMO_MUSEUM_ID } from "@/data/museum";
import { getCurrentUser } from "@/lib/supabase/server";

const MAX_ARTWORKS = 10;
const MAX_IMAGE_DATA_URL_LENGTH = 2_000_000; // ~1.5MB image, base64-inflated
const MAX_NAME_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 500;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isValidImageDataUrl(value: unknown): value is string {
  return (
    isString(value) &&
    value.length > 0 &&
    value.length <= MAX_IMAGE_DATA_URL_LENGTH &&
    /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(value)
  );
}

interface ArtworkPayload {
  title?: unknown;
  artist?: unknown;
  description?: unknown;
  year?: unknown;
  medium?: unknown;
  imageDataUrl?: unknown;
  imageAspectRatio?: unknown;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to create a museum." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;

  const name = isString(payload.name) ? payload.name.trim().slice(0, MAX_NAME_LENGTH) : "";
  if (!name) {
    return NextResponse.json({ error: "A museum name is required." }, { status: 400 });
  }

  const description = isString(payload.description)
    ? payload.description.trim().slice(0, MAX_DESCRIPTION_LENGTH)
    : "";

  const theme = isString(payload.theme) && payload.theme in GALLERY_THEMES
    ? (payload.theme as GalleryThemeId)
    : "linen";

  const rawArtworks = Array.isArray(payload.artworks) ? (payload.artworks as ArtworkPayload[]) : [];
  if (rawArtworks.length === 0) {
    return NextResponse.json({ error: "Add at least one piece of artwork." }, { status: 400 });
  }
  if (rawArtworks.length > MAX_ARTWORKS) {
    return NextResponse.json(
      { error: `This prototype supports up to ${MAX_ARTWORKS} artworks per museum.` },
      { status: 400 }
    );
  }

  const artworks: UploadedArtworkInput[] = [];
  for (let i = 0; i < rawArtworks.length; i++) {
    const raw = rawArtworks[i];
    const title = isString(raw.title) ? raw.title.trim().slice(0, 80) : "";
    const artist = isString(raw.artist) ? raw.artist.trim().slice(0, 60) : "";
    const imageDataUrl = raw.imageDataUrl;

    if (!title || !artist) {
      return NextResponse.json(
        { error: `Artwork ${i + 1} needs a title and an artist name.` },
        { status: 400 }
      );
    }
    if (!isValidImageDataUrl(imageDataUrl)) {
      return NextResponse.json(
        { error: `Artwork ${i + 1} needs a valid image (PNG, JPEG, WebP, or GIF, under ~1.5MB).` },
        { status: 400 }
      );
    }

    const rawDescription = isString(raw.description) ? raw.description.trim().slice(0, 500) : "";
    const medium = isString(raw.medium) && raw.medium.trim() ? raw.medium.trim().slice(0, 60) : "Mixed media";
    const year =
      typeof raw.year === "number" && Number.isFinite(raw.year)
        ? Math.min(2100, Math.max(1900, Math.round(raw.year)))
        : new Date().getFullYear();
    const imageAspectRatio =
      typeof raw.imageAspectRatio === "number" && Number.isFinite(raw.imageAspectRatio) && raw.imageAspectRatio > 0
        ? raw.imageAspectRatio
        : 4 / 3;

    artworks.push({
      id: `${slugify(title) || "artwork"}-${randomSuffix()}`,
      title,
      artist,
      year,
      medium,
      description: rawDescription || `${title} by ${artist}.`,
      altText: rawDescription || `Artwork titled "${title}" by ${artist}.`,
      imageUrl: imageDataUrl,
      imageAspectRatio,
    });
  }

  let museumId = slugify(name) || "museum";
  if (museumId === DEMO_MUSEUM_ID) museumId = `${museumId}-museum`;
  while (await hasMuseum(museumId)) {
    museumId = `${slugify(name) || "museum"}-${randomSuffix()}`;
  }

  const museum = generateSingleRoomMuseum({
    id: museumId,
    ownerId: user.id,
    name,
    description: description || "A personal collection.",
    theme,
    artworks,
  });

  try {
    await createMuseum(museum);
  } catch {
    return NextResponse.json(
      { error: "Couldn't save your museum. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ museumId }, { status: 201 });
}
