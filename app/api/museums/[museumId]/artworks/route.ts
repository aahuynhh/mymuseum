import { NextResponse } from "next/server";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { DEMO_MUSEUM_ID } from "@/data/museum";
import { validateImage, ImageValidationError } from "@/lib/artwork/validateImage";
import { parseUploadRequest, PayloadTooLargeError, type ParsedFile } from "@/lib/artwork/parseUploadRequest";
import { buildArtworkStoragePath, uploadArtworkImage, deleteArtworkImages } from "@/lib/artwork/storage";
import {
  MAX_ARTWORKS_PER_MUSEUM,
  MAX_TOTAL_REQUEST_BYTES,
  MAX_TITLE_LENGTH,
  MAX_ARTIST_LENGTH,
  MAX_ARTWORK_DESCRIPTION_LENGTH,
  MAX_MEDIUM_LENGTH,
} from "@/lib/artwork/limits";
import { slugify, randomSuffix } from "@/lib/museum/slug";
import { insertArtworks, getArtworkCountForMuseum, type NewArtworkRow } from "@/server/artworksRepository";
import { relayoutMuseum } from "@/server/museumLayout";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

const PLACEHOLDER_WALL_POSITION = { x: 0, y: 0, z: 0, rotationY: 0 };
const PLACEHOLDER_INTERACTION_ZONE = { x: 0, z: 0, radius: 0 };

/** Owner-only "add one artwork to an existing museum" -- reuses the exact
 * same validate/upload primitives the create flow (app/api/museums/route.ts)
 * uses for each of its images, then triggers a full relayout so the new
 * piece (and everything already in the room) gets a real, non-overlapping
 * position. See server/museumLayout.ts's relayoutMuseum. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ museumId: string }> }
) {
  const { museumId } = await params;

  if (museumId === DEMO_MUSEUM_ID) {
    return NextResponse.json({ error: "The demo museum can't be edited." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const currentCount = await getArtworkCountForMuseum(museumId);
  if (currentCount === 0) {
    return NextResponse.json({ error: "Museum not found, or you don't own it." }, { status: 404 });
  }
  if (currentCount >= MAX_ARTWORKS_PER_MUSEUM) {
    return NextResponse.json(
      { error: `This prototype supports up to ${MAX_ARTWORKS_PER_MUSEUM} artworks per museum.` },
      { status: 400 }
    );
  }

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

  const title = isString(payload.title) ? payload.title.trim().slice(0, MAX_TITLE_LENGTH) : "";
  const artist = isString(payload.artist) ? payload.artist.trim().slice(0, MAX_ARTIST_LENGTH) : "";
  if (!title || !artist) {
    return NextResponse.json({ error: "A title and an artist name are required." }, { status: 400 });
  }

  const file = parsed.files.find((f) => f.fieldName === "image");
  if (!file) {
    return NextResponse.json({ error: "An image is required." }, { status: 400 });
  }

  let validated;
  try {
    validated = await validateImage(file.buffer);
  } catch (err) {
    const message = err instanceof ImageValidationError ? err.message : "Couldn't process this image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const description = isString(payload.description)
    ? payload.description.trim().slice(0, MAX_ARTWORK_DESCRIPTION_LENGTH)
    : "";
  const medium =
    isString(payload.medium) && payload.medium.trim() ? payload.medium.trim().slice(0, MAX_MEDIUM_LENGTH) : "Mixed media";
  const year =
    typeof payload.year === "number" && Number.isFinite(payload.year)
      ? Math.min(2100, Math.max(1900, Math.round(payload.year)))
      : new Date().getFullYear();

  const artworkId = `${slugify(title) || "artwork"}-${randomSuffix()}`;
  const storagePath = buildArtworkStoragePath(user.id, museumId, artworkId, validated.extension);

  const supabase = await createClient();

  try {
    await uploadArtworkImage(supabase, storagePath, validated.buffer, validated.contentType);
  } catch {
    return NextResponse.json({ error: "Couldn't upload your artwork. Please try again." }, { status: 500 });
  }

  const row: NewArtworkRow = {
    id: artworkId,
    museumId,
    title,
    artist,
    year,
    medium,
    description: description || `${title} by ${artist}.`,
    altText: description || `Artwork titled "${title}" by ${artist}.`,
    storagePath,
    imageWidth: validated.width,
    imageHeight: validated.height,
    displayOrder: currentCount + 1,
    wallPosition: PLACEHOLDER_WALL_POSITION,
    interactionZone: PLACEHOLDER_INTERACTION_ZONE,
  };

  try {
    await insertArtworks([row]);
  } catch {
    await deleteArtworkImages(supabase, [storagePath]);
    return NextResponse.json({ error: "Couldn't save your artwork. Please try again." }, { status: 500 });
  }

  const relayoutOk = await relayoutMuseum(museumId, user.id);

  return NextResponse.json(
    {
      artworkId,
      layoutWarning: relayoutOk
        ? undefined
        : "Artwork added, but the layout couldn't be recomputed. Try editing again to refresh it.",
    },
    { status: 201 }
  );
}
