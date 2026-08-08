import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { deleteMuseum } from "@/server/museumsRepository";
import { DEMO_MUSEUM_ID } from "@/data/museum";

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
