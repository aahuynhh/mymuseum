import { NextResponse } from "next/server";
import { GALLERY_THEMES, type GalleryThemeId } from "@/game/museum/themes";
import { getCurrentUser } from "@/lib/supabase/server";
import { deleteMuseum, updateMuseumMetadata } from "@/server/museumsRepository";
import { DEMO_MUSEUM_ID } from "@/data/museum";
import { MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH } from "@/lib/artwork/limits";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

/** Owner-only museum metadata update -- name/description/theme/publish
 * state. See server/museumsRepository.ts's updateMuseumMetadata for why a
 * theme change also patches the room's own `theme` field, not just the
 * denormalized `museums.theme` column. */
export async function PATCH(
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

  const patch: { name?: string; description?: string; isPublished?: boolean; theme?: GalleryThemeId } = {};

  if (payload.name !== undefined) {
    const name = isString(payload.name) ? payload.name.trim().slice(0, MAX_NAME_LENGTH) : "";
    if (!name) {
      return NextResponse.json({ error: "A museum name is required." }, { status: 400 });
    }
    patch.name = name;
  }

  if (payload.description !== undefined) {
    patch.description = isString(payload.description)
      ? payload.description.trim().slice(0, MAX_DESCRIPTION_LENGTH)
      : "";
  }

  if (payload.isPublished !== undefined) {
    if (typeof payload.isPublished !== "boolean") {
      return NextResponse.json({ error: "Invalid publish state." }, { status: 400 });
    }
    patch.isPublished = payload.isPublished;
  }

  if (payload.theme !== undefined) {
    if (!isString(payload.theme) || !(payload.theme in GALLERY_THEMES)) {
      return NextResponse.json({ error: "Invalid theme." }, { status: 400 });
    }
    patch.theme = payload.theme as GalleryThemeId;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const ok = await updateMuseumMetadata(museumId, user.id, patch);
  if (!ok) {
    return NextResponse.json({ error: "Museum not found, or you don't own it." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ museumId: string }> }
) {
  const { museumId } = await params;

  if (museumId === DEMO_MUSEUM_ID) {
    return NextResponse.json({ error: "The demo museum can't be deleted." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { deleted } = await deleteMuseum(museumId, user.id);
  if (!deleted) {
    return NextResponse.json({ error: "Museum not found, or you don't own it." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
