import { NextResponse } from "next/server";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { DEMO_MUSEUM_ID } from "@/data/museum";
import {
  updateArtworkMetadata,
  deleteArtwork,
  getArtworkCountForMuseum,
  type ArtworkMetadataPatch,
} from "@/server/artworksRepository";
import { deleteArtworkImages } from "@/lib/artwork/storage";
import { relayoutMuseum } from "@/server/museumLayout";
import {
  MAX_TITLE_LENGTH,
  MAX_ARTIST_LENGTH,
  MAX_ARTWORK_DESCRIPTION_LENGTH,
  MAX_MEDIUM_LENGTH,
} from "@/lib/artwork/limits";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

/** Owner-only artwork text-metadata update -- title/artist/year/medium/
 * description/alt text only. Never touches the image, layout, or
 * museum_id; text edits don't affect aspect ratio or frame size, so no
 * relayout runs here (see server/museumLayout.ts). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ museumId: string; artworkId: string }> }
) {
  const { museumId, artworkId } = await params;

  if (museumId === DEMO_MUSEUM_ID) {
    return NextResponse.json({ error: "The demo museum can't be edited." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;

  const patch: ArtworkMetadataPatch = {};

  if (payload.title !== undefined) {
    const title = isString(payload.title) ? payload.title.trim().slice(0, MAX_TITLE_LENGTH) : "";
    if (!title) {
      return NextResponse.json({ error: "A title is required." }, { status: 400 });
    }
    patch.title = title;
  }

  if (payload.artist !== undefined) {
    const artist = isString(payload.artist) ? payload.artist.trim().slice(0, MAX_ARTIST_LENGTH) : "";
    if (!artist) {
      return NextResponse.json({ error: "An artist name is required." }, { status: 400 });
    }
    patch.artist = artist;
  }

  if (payload.year !== undefined) {
    if (typeof payload.year !== "number" || !Number.isFinite(payload.year)) {
      return NextResponse.json({ error: "Invalid year." }, { status: 400 });
    }
    patch.year = Math.min(2100, Math.max(1900, Math.round(payload.year)));
  }

  if (payload.medium !== undefined) {
    const medium = isString(payload.medium) ? payload.medium.trim().slice(0, MAX_MEDIUM_LENGTH) : "";
    patch.medium = medium || "Mixed media";
  }

  if (payload.description !== undefined) {
    patch.description = isString(payload.description)
      ? payload.description.trim().slice(0, MAX_ARTWORK_DESCRIPTION_LENGTH)
      : "";
  }

  if (payload.altText !== undefined) {
    patch.altText = isString(payload.altText)
      ? payload.altText.trim().slice(0, MAX_ARTWORK_DESCRIPTION_LENGTH)
      : "";
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const ok = await updateArtworkMetadata(artworkId, museumId, patch);
  if (!ok) {
    return NextResponse.json({ error: "Artwork not found, or you don't own it." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

/** Owner-only artwork removal -- deletes the DB row first (authoritative),
 * then best-effort removes the matching Storage object, then triggers a
 * full relayout of whatever's left. Refuses to remove a museum's last
 * remaining artwork -- a museum always keeps at least one piece, matching
 * the create flow's own minimum. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ museumId: string; artworkId: string }> }
) {
  const { museumId, artworkId } = await params;

  if (museumId === DEMO_MUSEUM_ID) {
    return NextResponse.json({ error: "The demo museum can't be edited." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const count = await getArtworkCountForMuseum(museumId);
  if (count <= 1) {
    return NextResponse.json(
      { error: "A museum needs at least one artwork. Add a replacement first, or delete the museum instead." },
      { status: 400 }
    );
  }

  const storagePath = await deleteArtwork(artworkId, museumId);
  if (!storagePath) {
    return NextResponse.json({ error: "Artwork not found, or you don't own it." }, { status: 404 });
  }

  const supabase = await createClient();
  await deleteArtworkImages(supabase, [storagePath]);

  const relayoutOk = await relayoutMuseum(museumId, user.id);

  return NextResponse.json({
    ok: true,
    layoutWarning: relayoutOk ? undefined : "Artwork removed, but the layout couldn't be recomputed. Try editing again to refresh it.",
  });
}
