import { NextResponse } from "next/server";
import { GALLERY_THEMES, type GalleryThemeId } from "@/game/museum/themes";
import { getCurrentUser } from "@/lib/supabase/server";
import { deleteMuseum, updateMuseumMetadata, type MuseumMetadataPatch } from "@/server/museumsRepository";
import { artworkExistsInMuseum } from "@/server/artworksRepository";
import { DEMO_MUSEUM_ID } from "@/data/museum";
import { MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH } from "@/lib/artwork/limits";
import type { RoomBounds, WallOpening, WallSide } from "@/types";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

const WALL_SIDES: WallSide[] = ["north", "south", "east", "west"];

function parseBounds(value: unknown): RoomBounds | null {
  if (typeof value !== "object" || value === null) return null;
  const { minX, maxX, minZ, maxZ } = value as Record<string, unknown>;
  if (!isFiniteNumber(minX) || !isFiniteNumber(maxX) || !isFiniteNumber(minZ) || !isFiniteNumber(maxZ)) return null;
  if (minX >= maxX || minZ >= maxZ) return null;
  return { minX, maxX, minZ, maxZ };
}

function parseOpenings(value: unknown): WallOpening[] | null {
  if (!Array.isArray(value)) return null;
  const openings: WallOpening[] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) return null;
    const { wall, center, width, isEntrance } = entry as Record<string, unknown>;
    if (!isString(wall) || !WALL_SIDES.includes(wall as WallSide)) return null;
    if (!isFiniteNumber(center) || !isFiniteNumber(width) || width <= 0) return null;
    if (isEntrance !== undefined && typeof isEntrance !== "boolean") return null;
    openings.push({ wall: wall as WallSide, center, width, ...(isEntrance !== undefined && { isEntrance }) });
  }
  return openings;
}

/** Validates the owner-supplied `room` patch used to attach a custom
 * Blender room (GalleryRoom.modelUrl) -- see the Custom Blender room plan.
 * Every sub-field is independently optional (merged onto the existing room
 * server-side, see updateMuseumMetadata), so a caller can send just
 * `modelUrl` to reuse a room's current bounds, or send all four together. */
function parseRoomPatch(value: unknown): MuseumMetadataPatch["room"] | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const { modelUrl, bounds, height, openings } = value as Record<string, unknown>;

  const patch: NonNullable<MuseumMetadataPatch["room"]> = {};
  if (modelUrl !== undefined) {
    if (modelUrl !== null && !isString(modelUrl)) return undefined;
    patch.modelUrl = modelUrl;
  }
  if (bounds !== undefined) {
    const parsed = parseBounds(bounds);
    if (!parsed) return undefined;
    patch.bounds = parsed;
  }
  if (height !== undefined) {
    if (!isFiniteNumber(height) || height <= 0) return undefined;
    patch.height = height;
  }
  if (openings !== undefined) {
    const parsed = parseOpenings(openings);
    if (!parsed) return undefined;
    patch.openings = parsed;
  }
  return patch;
}

/** Owner-only museum metadata update -- name/description/theme/publish
 * state/cover thumbnail/room. See server/museumsRepository.ts's
 * updateMuseumMetadata for why a theme change also patches the room's own
 * `theme` field, not just the denormalized `museums.theme` column, and for
 * how a `room` patch (attaching a custom Blender model) merges onto the
 * existing room rather than replacing it outright. */
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

  const patch: MuseumMetadataPatch = {};

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

  if (payload.coverArtworkId !== undefined) {
    if (payload.coverArtworkId === null) {
      patch.coverArtworkId = null;
    } else if (isString(payload.coverArtworkId)) {
      const belongsToMuseum = await artworkExistsInMuseum(payload.coverArtworkId, museumId);
      if (!belongsToMuseum) {
        return NextResponse.json({ error: "That artwork isn't part of this museum." }, { status: 400 });
      }
      patch.coverArtworkId = payload.coverArtworkId;
    } else {
      return NextResponse.json({ error: "Invalid cover artwork." }, { status: 400 });
    }
  }

  if (payload.room !== undefined) {
    const roomPatch = parseRoomPatch(payload.room);
    if (!roomPatch) {
      return NextResponse.json({ error: "Invalid room data." }, { status: 400 });
    }
    patch.room = roomPatch;
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
