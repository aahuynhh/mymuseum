import { NextResponse } from "next/server";
import { GALLERY_THEMES, type GalleryThemeId } from "@/game/museum/themes";
import type { UploadedArtworkInput } from "@/game/museum/autoLayout";
import { generateMuseumLayout } from "@/game/museum/multiRoomLayout";
import { hasMuseum, createMuseum, setCoverArtworkId, deleteMuseum } from "@/server/museumsRepository";
import { insertArtworks, type NewArtworkRow } from "@/server/artworksRepository";
import { DEMO_MUSEUM_ID } from "@/data/museum";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { validateImage, ImageValidationError } from "@/lib/artwork/validateImage";
import { parseUploadRequest, PayloadTooLargeError, type ParsedFile } from "@/lib/artwork/parseUploadRequest";
import { buildArtworkStoragePath, uploadArtworkImage, deleteArtworkImages } from "@/lib/artwork/storage";
import {
  MAX_ARTWORKS_PER_MUSEUM,
  MAX_TOTAL_REQUEST_BYTES,
  MAX_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_ARTIST_LENGTH,
  MAX_ARTWORK_DESCRIPTION_LENGTH,
  MAX_MEDIUM_LENGTH,
} from "@/lib/artwork/limits";
import { slugify, randomSuffix } from "@/lib/museum/slug";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

interface ArtworkMeta {
  title?: unknown;
  artist?: unknown;
  description?: unknown;
  year?: unknown;
  medium?: unknown;
}

interface PreparedArtwork {
  id: string;
  title: string;
  artist: string;
  year: number;
  medium: string;
  description: string;
  altText: string;
  extension: string;
  contentType: string;
  buffer: Buffer;
  imageWidth: number;
  imageHeight: number;
  imageAspectRatio: number;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to create a museum." }, { status: 401 });
  }

  // Cheap, spoofable fast path (Content-Length is client-supplied and can be
  // absent or wrong) -- the real enforcement is the byte-by-byte streaming
  // check inside parseUploadRequest below. Still worth rejecting an
  // obviously-oversized request before spending any work on it.
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_TOTAL_REQUEST_BYTES) {
    return NextResponse.json({ error: "Upload is too large." }, { status: 413 });
  }

  let parsed: { fields: Record<string, string>; files: ParsedFile[] };
  try {
    parsed = await parseUploadRequest(request);
  } catch (err) {
    if (err instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: err.message }, { status: 413 });
    }
    return NextResponse.json({ error: "Couldn't read the upload." }, { status: 400 });
  }

  let meta: unknown;
  try {
    meta = JSON.parse(parsed.fields.meta ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof meta !== "object" || meta === null) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const payload = meta as Record<string, unknown>;

  const name = isString(payload.name) ? payload.name.trim().slice(0, MAX_NAME_LENGTH) : "";
  if (!name) {
    return NextResponse.json({ error: "A museum name is required." }, { status: 400 });
  }

  const description = isString(payload.description)
    ? payload.description.trim().slice(0, MAX_DESCRIPTION_LENGTH)
    : "";

  const theme =
    isString(payload.theme) && payload.theme in GALLERY_THEMES
      ? (payload.theme as GalleryThemeId)
      : "linen";

  const rawArtworks = Array.isArray(payload.artworks) ? (payload.artworks as ArtworkMeta[]) : [];
  if (rawArtworks.length === 0) {
    return NextResponse.json({ error: "Add at least one piece of artwork." }, { status: 400 });
  }
  if (rawArtworks.length > MAX_ARTWORKS_PER_MUSEUM) {
    return NextResponse.json(
      { error: `This prototype supports up to ${MAX_ARTWORKS_PER_MUSEUM} artworks per museum.` },
      { status: 400 }
    );
  }

  const filesByField = new Map(parsed.files.map((f) => [f.fieldName, f]));
  if (filesByField.size !== rawArtworks.length) {
    return NextResponse.json({ error: "Each artwork needs exactly one image." }, { status: 400 });
  }

  // Which uploaded piece (by position in `artworks`) the creator picked as
  // the museum's cover thumbnail, e.g. via a "Set as cover" choice in
  // CreateMuseumForm. Optional -- an out-of-range or absent value just
  // leaves the museum on its default (first artwork by display order), same
  // fallback CoverArtworkPicker already uses post-creation.
  const coverArtworkIndex =
    typeof payload.coverArtworkIndex === "number" &&
    Number.isInteger(payload.coverArtworkIndex) &&
    payload.coverArtworkIndex >= 0 &&
    payload.coverArtworkIndex < rawArtworks.length
      ? payload.coverArtworkIndex
      : null;

  // Validate everything -- metadata and real image content/dimensions --
  // before writing anything anywhere, so a bad artwork partway through the
  // list never leaves a partial upload behind.
  const prepared: PreparedArtwork[] = [];
  for (let i = 0; i < rawArtworks.length; i++) {
    const raw = rawArtworks[i];
    const title = isString(raw.title) ? raw.title.trim().slice(0, MAX_TITLE_LENGTH) : "";
    const artist = isString(raw.artist) ? raw.artist.trim().slice(0, MAX_ARTIST_LENGTH) : "";
    if (!title || !artist) {
      return NextResponse.json(
        { error: `Artwork ${i + 1} needs a title and an artist name.` },
        { status: 400 }
      );
    }

    const file = filesByField.get(`image-${i}`);
    if (!file) {
      return NextResponse.json({ error: `Artwork ${i + 1} is missing its image.` }, { status: 400 });
    }

    let validated;
    try {
      // Authority on "is this really an image, what type, what size" --
      // never the client's declared MIME type or filename.
      validated = await validateImage(file.buffer);
    } catch (err) {
      const message = err instanceof ImageValidationError ? err.message : "Couldn't process this image.";
      return NextResponse.json({ error: `Artwork ${i + 1}: ${message}` }, { status: 400 });
    }

    const rawDescription = isString(raw.description)
      ? raw.description.trim().slice(0, MAX_ARTWORK_DESCRIPTION_LENGTH)
      : "";
    const medium =
      isString(raw.medium) && raw.medium.trim() ? raw.medium.trim().slice(0, MAX_MEDIUM_LENGTH) : "Mixed media";
    const year =
      typeof raw.year === "number" && Number.isFinite(raw.year)
        ? Math.min(2100, Math.max(1900, Math.round(raw.year)))
        : new Date().getFullYear();

    prepared.push({
      id: `${slugify(title) || "artwork"}-${randomSuffix()}`,
      title,
      artist,
      year,
      medium,
      description: rawDescription || `${title} by ${artist}.`,
      altText: rawDescription || `Artwork titled "${title}" by ${artist}.`,
      extension: validated.extension,
      contentType: validated.contentType,
      buffer: validated.buffer,
      imageWidth: validated.width,
      imageHeight: validated.height,
      imageAspectRatio: validated.width / validated.height,
    });
  }

  let museumId = slugify(name) || "museum";
  if (museumId === DEMO_MUSEUM_ID) museumId = `${museumId}-museum`;
  while (await hasMuseum(museumId)) {
    museumId = `${slugify(name) || "museum"}-${randomSuffix()}`;
  }

  const preparedById = new Map(prepared.map((p) => [p.id, p]));

  const layoutInputs: UploadedArtworkInput[] = prepared.map((p) => ({
    id: p.id,
    title: p.title,
    artist: p.artist,
    year: p.year,
    medium: p.medium,
    description: p.description,
    altText: p.altText,
    imageUrl: buildArtworkStoragePath(user.id, museumId, p.id, p.extension),
    imageAspectRatio: p.imageAspectRatio,
  }));

  const museum = generateMuseumLayout({
    id: museumId,
    ownerId: user.id,
    name,
    description: description || "A personal collection.",
    theme,
    artworks: layoutInputs,
  });

  const supabase = await createClient();
  const uploadedPaths: string[] = [];
  const ownerId = user.id;

  // Deletes whatever Storage objects were uploaded so far, then the
  // just-created museum row (deleteMuseum is safe to call even if the row
  // is already gone, or already has no artwork -- see its own docs). Used
  // by both failure branches below.
  async function rollbackMuseumCreation(): Promise<void> {
    await deleteArtworkImages(supabase, uploadedPaths);
    await deleteMuseum(museumId, ownerId);
  }

  // The museum row is created FIRST, before any Storage upload. The
  // Storage INSERT policy (supabase/migrations/0003_artwork_storage.sql)
  // requires the caller to be writing beneath their own UUID prefix; the
  // artworks table's own RLS (artworks_insert_own, same migration) is what
  // separately requires the target museum_id to already exist and be
  // owned by the caller -- so the museum row has to exist first regardless.
  // Nothing to roll back on failure here: no Storage objects have been
  // touched yet.
  try {
    await createMuseum(museum);
  } catch {
    return NextResponse.json({ error: "Couldn't save your museum. Please try again." }, { status: 500 });
  }

  // Upload phase, now that the museum row exists. If any file fails
  // partway through, roll back every object already uploaded plus the
  // museum row itself, so a failed submission never leaves an empty
  // museum or orphaned Storage objects with no matching DB rows.
  for (const artwork of museum.artworks) {
    const preparedArtwork = preparedById.get(artwork.id);
    if (!preparedArtwork) continue; // unreachable -- every artwork.id came from `prepared`
    try {
      await uploadArtworkImage(supabase, artwork.imageUrl, preparedArtwork.buffer, preparedArtwork.contentType);
      uploadedPaths.push(artwork.imageUrl);
    } catch {
      await rollbackMuseumCreation();
      return NextResponse.json({ error: "Couldn't upload your artwork. Please try again." }, { status: 500 });
    }
  }

  try {
    const artworkRows: NewArtworkRow[] = museum.artworks.map((artwork) => {
      const preparedArtwork = preparedById.get(artwork.id)!;
      return {
        id: artwork.id,
        museumId,
        title: artwork.title,
        artist: artwork.artist,
        year: artwork.year,
        medium: artwork.medium,
        description: artwork.description,
        altText: artwork.altText,
        storagePath: artwork.imageUrl,
        imageWidth: preparedArtwork.imageWidth,
        imageHeight: preparedArtwork.imageHeight,
        displayOrder: artwork.displayOrder,
        wallPosition: artwork.wallPosition,
        interactionZone: artwork.interactionZone,
        frameWidth: artwork.frameWidth,
        frameHeight: artwork.frameHeight,
      };
    });
    await insertArtworks(artworkRows);
  } catch {
    await rollbackMuseumCreation();
    return NextResponse.json({ error: "Couldn't save your artwork. Please try again." }, { status: 500 });
  }

  // Best-effort: the museum and its artwork are already durably saved at
  // this point, so a failure to pin the cover shouldn't fail (or roll back)
  // the whole creation -- it just leaves the museum on its default cover
  // (first artwork by display order).
  if (coverArtworkIndex !== null) {
    const coverArtwork = prepared[coverArtworkIndex];
    await setCoverArtworkId(museumId, ownerId, coverArtwork.id);
  }

  return NextResponse.json({ museumId }, { status: 201 });
}
